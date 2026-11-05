/**
 * Unit test: Sankey builder flow balance.
 * Asserts that for each generator, the sum of outgoing link weights equals
 * its total generation MWh, and for each consumer, ingoing = outgoing.
 * Tests a 2-consumer, 3-generator portfolio with partial allocations
 * at all three granularities.
 */

import { describe, expect, it } from 'vitest'
import { runEngine } from '../../../../engine'
import type { EngineInput, MatchingGranularity } from '../../../../engine/types'
import { buildPortfolioSankey, checkSankeyBalance } from '../sankeyConfig'

/** Build a simple test portfolio with 2 consumers, 3 generators, partial allocations. */
function buildTestInput(granularity: MatchingGranularity): EngineInput {
  const flat = new Array(8760).fill(1 / 8760)
  // Solar-like: more generation in daytime hours
  const solarShape = new Array(8760).fill(0).map((_, i) => {
    const hour = i % 24
    return hour >= 6 && hour <= 18 ? 2 / (13 * 365) : 0
  })
  // Normalise solar shape to sum = 1
  const solarSum = solarShape.reduce((a, b) => a + b, 0)
  const solarNorm = solarShape.map((v) => v / solarSum)

  return {
    consumers: [
      { id: 'c1', demandMWh: flat.map((v) => v * 10000) },
      { id: 'c2', demandMWh: flat.map((v) => v * 5000) },
    ],
    generators: [
      { id: 'g1', generationMWh: solarNorm.map((v) => v * 8000) },
      { id: 'g2', generationMWh: flat.map((v) => v * 6000) },
      { id: 'g3', generationMWh: flat.map((v) => v * 3000) },
    ],
    matrix: {
      g1: { c1: 60, c2: 30 }, // 10% unallocated surplus
      g2: { c1: 50, c2: 50 },
      g3: { c1: 80, c2: 20 },
    },
    granularity,
  }
}

describe('Sankey flow balance', () => {
  const granularities: MatchingGranularity[] = ['hourly', 'monthly', 'annual']

  for (const granularity of granularities) {
    it(`balances at ${granularity} granularity`, () => {
      const input = buildTestInput(granularity)
      const result = runEngine(input)

      const genNameMap = new Map([
        ['g1', 'Gen 1'],
        ['g2', 'Gen 2'],
        ['g3', 'Gen 3'],
      ])
      const conNameMap = new Map([
        ['c1', 'Consumer 1'],
        ['c2', 'Consumer 2'],
      ])
      const techMap = new Map([
        ['g1', 'solar'],
        ['g2', 'wind-onshore'],
        ['g3', 'hydro'],
      ])

      const sankey = buildPortfolioSankey(result, genNameMap, conNameMap, techMap)

      // Build expected totals map: generator node id → total generation MWh
      const generatorTotals = new Map<string, number>()
      for (const gen of result.generators) {
        generatorTotals.set(`gen-${gen.generatorId}`, gen.totalGenerationMWh)
      }

      const errors = checkSankeyBalance(sankey, generatorTotals)
      expect(errors).toEqual([])
    })
  }

  it('has three columns: generators=0, consumers=1, outcomes=2', () => {
    const input = buildTestInput('hourly')
    const result = runEngine(input)
    const genNameMap = new Map([
      ['g1', 'Gen 1'],
      ['g2', 'Gen 2'],
      ['g3', 'Gen 3'],
    ])
    const conNameMap = new Map([
      ['c1', 'Consumer 1'],
      ['c2', 'Consumer 2'],
    ])
    const techMap = new Map([
      ['g1', 'solar'],
      ['g2', 'wind-onshore'],
      ['g3', 'hydro'],
    ])

    const sankey = buildPortfolioSankey(result, genNameMap, conNameMap, techMap)

    // Generators at column 0
    const genNodes = sankey.nodes.filter((n) => n.id.startsWith('gen-'))
    expect(genNodes.every((n) => n.column === 0)).toBe(true)

    // Consumers at column 1
    const conNodes = sankey.nodes.filter((n) => n.id.startsWith('con-'))
    expect(conNodes.every((n) => n.column === 1)).toBe(true)

    // Outcome nodes at column 2
    const outcomeNodes = sankey.nodes.filter(
      (n) => n.id === 'matched' || n.id === 'excess' || n.id === 'surplus',
    )
    expect(outcomeNodes.every((n) => n.column === 2)).toBe(true)
  })

  it('uses "Surplus generation" label, not "Unallocated"', () => {
    const input = buildTestInput('hourly')
    const result = runEngine(input)
    const genNameMap = new Map([
      ['g1', 'Gen 1'],
      ['g2', 'Gen 2'],
      ['g3', 'Gen 3'],
    ])
    const conNameMap = new Map([
      ['c1', 'Consumer 1'],
      ['c2', 'Consumer 2'],
    ])
    const techMap = new Map([
      ['g1', 'solar'],
      ['g2', 'wind-onshore'],
      ['g3', 'hydro'],
    ])

    const sankey = buildPortfolioSankey(result, genNameMap, conNameMap, techMap)

    expect(sankey.nodes.some((n) => n.name === 'Unallocated')).toBe(false)
    // g1 has 10% unallocated, so surplus node should exist
    const surplusNode = sankey.nodes.find((n) => n.id === 'surplus')
    expect(surplusNode).toBeDefined()
    expect(surplusNode?.name).toBe('Surplus generation')
  })
})
