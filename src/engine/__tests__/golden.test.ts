import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import goldenJson from '../fixtures/revolt-golden.json'
import registryJson from '../../data/profiles/registry.json'
import { runEngine } from '../score'
import {
  HOURS_PER_YEAR,
  type AllocationMatrix,
  type Consumer,
  type Generator,
  type MatchingGranularity,
} from '../types'

interface ConsumerExpectation {
  hourlyScore: number
  annualScore: number
  totalAllocatedMWh: number
  totalMatchedMWh: number
  totalExcessMWh: number
  totalUnmatchedMWh: number
  monthlyMatchedMWh: number[]
  monthlyExcessMWh: number[]
  allocatedByGeneratorMonthlyMWh: Record<string, number[]>
  hourlyAllocatedByGenerator: Record<string, number[]> | null
}

interface GoldenScenario {
  id: string
  inputs: {
    consumers: { id: string; profile: string; annualMWh: number }[]
    generators: { id: string; profile: string; capacityMW: number }[]
    matrix: AllocationMatrix
  }
  results: Record<string, Record<string, ConsumerExpectation>>
}

interface Registry {
  consumption: { id: string; file: string }[]
  generation: { id: string; file: string; capacityFactor: number }[]
}

const golden = goldenJson as unknown as { scenarios: GoldenScenario[] }
const registry = registryJson as unknown as Registry

function loadShape(file: string): number[] {
  const path = new URL(`../../data/profiles/${file}`, import.meta.url)
  return (JSON.parse(readFileSync(path, 'utf8')) as { data: number[] }).data
}

function series(shape: number[], annualMWh: number): number[] {
  const total = shape.reduce((a, b) => a + b, 0)
  return shape.map((v) => (v / total) * annualMWh)
}

const RELATIVE_TOLERANCE = 1e-6

function expectClose(actual: number, expected: number, label: string): void {
  const tolerance = Math.max(Math.abs(expected) * RELATIVE_TOLERANCE, 1e-6)
  expect(Math.abs(actual - expected), `${label}: got ${actual}, expected ${expected}`).toBeLessThanOrEqual(
    tolerance,
  )
}

describe('parity with the Granular platform engine (revolt golden fixtures)', () => {
  for (const scenario of golden.scenarios) {
    const consumers: Consumer[] = scenario.inputs.consumers.map((c) => {
      const entry = registry.consumption.find((e) => e.id === c.profile)!
      return { id: c.id, demandMWh: series(loadShape(entry.file), c.annualMWh) }
    })
    const generators: Generator[] = scenario.inputs.generators.map((g) => {
      const entry = registry.generation.find((e) => e.id === g.profile)!
      return {
        id: g.id,
        generationMWh: series(loadShape(entry.file), g.capacityMW * entry.capacityFactor * HOURS_PER_YEAR),
      }
    })

    for (const [granularity, byConsumer] of Object.entries(scenario.results)) {
      it(`${scenario.id} / ${granularity}`, () => {
        const result = runEngine({
          consumers,
          generators,
          matrix: scenario.inputs.matrix,
          granularity: granularity as MatchingGranularity,
        })
        for (const [consumerId, expected] of Object.entries(byConsumer)) {
          const actual = result.consumers.find((c) => c.consumerId === consumerId)!
          expectClose(actual.hourlyScore, expected.hourlyScore, `${consumerId} hourlyScore`)
          // revolt reports allocated ÷ demand; the tool's annualScore is volumetric (supplied ÷ demand)
          expectClose(
            (actual.totalAllocatedMWh / actual.totalDemandMWh) * 100,
            expected.annualScore,
            `${consumerId} allocated ÷ demand`,
          )
          expectClose(actual.totalAllocatedMWh, expected.totalAllocatedMWh, `${consumerId} allocated`)
          expectClose(actual.totalMatchedMWh, expected.totalMatchedMWh, `${consumerId} matched`)
          expectClose(actual.totalExcessMWh, expected.totalExcessMWh, `${consumerId} excess`)
          expectClose(actual.totalUnmatchedMWh, expected.totalUnmatchedMWh, `${consumerId} unmatched`)
          expected.monthlyMatchedMWh.forEach((v, m) =>
            expectClose(actual.monthlyMatchedMWh[m], v, `${consumerId} month ${m} matched`),
          )
          expected.monthlyExcessMWh.forEach((v, m) =>
            expectClose(actual.monthlyExcessMWh[m], v, `${consumerId} month ${m} excess`),
          )
          for (const [generatorId, monthly] of Object.entries(expected.allocatedByGeneratorMonthlyMWh)) {
            const contribution = actual.generators.find((g) => g.generatorId === generatorId)!
            monthly.forEach((v, m) =>
              expectClose(contribution.monthlyAllocatedMWh[m], v, `${consumerId}/${generatorId} month ${m}`),
            )
          }
          if (expected.hourlyAllocatedByGenerator) {
            for (const [generatorId, hourly] of Object.entries(expected.hourlyAllocatedByGenerator)) {
              const contribution = actual.generators.find((g) => g.generatorId === generatorId)!
              for (let h = 0; h < HOURS_PER_YEAR; h++) {
                expectClose(contribution.allocatedMWh[h], hourly[h], `${consumerId}/${generatorId} hour ${h}`)
              }
            }
          }
        }
      })
    }
  }
})
