import { describe, expect, it } from 'vitest'
import { HOURS_PER_YEAR } from '../../engine/types'
import type { EngineResult } from '../../engine/types'
import { createDemoPortfolio } from '../../state/demoPortfolio'
import {
  createScenarioResultsSummary,
  exportScenarioFile,
  generateId,
  scenarioFileToPortfolioState,
  validateScenarioFile,
} from '../scenarioIO'

/** Builds a minimal valid ScenarioFile object for testing. */
function makeValidFile() {
  const shape = new Array<number>(HOURS_PER_YEAR).fill(1 / HOURS_PER_YEAR)
  return {
    version: 1 as const,
    name: 'Test scenario',
    exportedAt: '2026-01-01T00:00:00.000Z',
    consumers: [
      {
        uid: 'c1',
        profileId: 'test',
        name: 'Consumer 1',
        annualMWh: 10000,
        shape,
        source: 'library' as const,
      },
    ],
    generators: [
      {
        uid: 'g1',
        profileId: 'test',
        name: 'Generator 1',
        annualMWh: 12000,
        capacityFactor: 0.3,
        technology: 'wind-onshore',
        shape,
        source: 'library' as const,
      },
    ],
    matrix: { g1: { c1: 100 } },
    granularity: 'hourly' as const,
  }
}

describe('generateId', () => {
  it('returns a non-empty string', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})

describe('createScenarioResultsSummary', () => {
  it('extracts tile values and monthly scores from an EngineResult', () => {
    const monthlyScores = [70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81]
    const fakeResult = {
      granularity: 'hourly',
      portfolio: {
        hourlyScore: 67.33,
        annualScore: 100.74,
        totalExcessMWh: 1234.5,
        totalUnmatchedMWh: 5678.9,
        monthlyScores,
        // Other fields that exist on MatchingSummary but are not extracted
        totalDemandMWh: 50000,
        totalSuppliedMWh: 50370,
        totalAllocatedMWh: 50370,
        totalMatchedMWh: 33665,
        monthlyDemandMWh: [],
        monthlyMatchedMWh: [],
        monthlyExcessMWh: [],
        monthlyUnmatchedMWh: [],
        demandMWh: [],
        allocatedMWh: [],
        matchedMWh: [],
        excessMWh: [],
        unmatchedMWh: [],
        hourlyMatchPct: [],
      },
      consumers: [],
      generators: [],
    } as unknown as EngineResult

    const summary = createScenarioResultsSummary(fakeResult)
    expect(summary.hourlyScore).toBe(67.33)
    expect(summary.annualScore).toBe(100.74)
    expect(summary.totalExcessMWh).toBe(1234.5)
    expect(summary.totalUnmatchedMWh).toBe(5678.9)
    expect(summary.monthlyScores).toEqual(monthlyScores)
    // Verify it is a copy, not a reference
    expect(summary.monthlyScores).not.toBe(monthlyScores)
  })
})

describe('exportScenarioFile', () => {
  it('produces the correct structure with version 1', () => {
    const state = {
      consumers: [
        {
          uid: 'c1',
          profileId: 'test',
          name: 'C1',
          annualMWh: 1000,
          shape: new Array<number>(HOURS_PER_YEAR).fill(0),
          source: 'library' as const,
        },
      ],
      generators: [
        {
          uid: 'g1',
          profileId: 'test',
          name: 'G1',
          annualMWh: 2000,
          capacityFactor: 0.25,
          technology: 'solar',
          shape: new Array<number>(HOURS_PER_YEAR).fill(0),
          source: 'library' as const,
        },
      ],
      matrix: { g1: { c1: 50 } },
      granularity: 'monthly' as const,
      allocationMode: 'generator-share' as const,
      consumptionMatrix: { g1: { c1: 0 } },
    }

    const file = exportScenarioFile('My scenario', state)

    expect(file.version).toBe(1)
    expect(file.name).toBe('My scenario')
    expect(file.exportedAt).toBeTruthy()
    expect(file.consumers).toEqual(state.consumers)
    expect(file.generators).toEqual(state.generators)
    expect(file.matrix).toEqual(state.matrix)
    expect(file.granularity).toBe('monthly')
  })

  it('includes an ISO timestamp', () => {
    const state = {
      consumers: [],
      generators: [],
      matrix: {},
      granularity: 'hourly' as const,
      allocationMode: 'generator-share' as const,
      consumptionMatrix: {},
    }
    // We test with empty arrays here just to verify the timestamp format;
    // validation would reject this, but exportScenarioFile does not validate.
    const file = exportScenarioFile('ts test', state)
    // ISO 8601 format check
    expect(() => new Date(file.exportedAt)).not.toThrow()
    expect(new Date(file.exportedAt).toISOString()).toBe(file.exportedAt)
  })
})

describe('validateScenarioFile', () => {
  it('accepts a valid file', () => {
    const result = validateScenarioFile(makeValidFile())
    expect(result.ok).toBe(true)
  })

  it('rejects a non-object', () => {
    const result = validateScenarioFile('not an object')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('not a valid JSON object')
  })

  it('rejects null', () => {
    const result = validateScenarioFile(null)
    expect(result.ok).toBe(false)
  })

  it('rejects {"bad": true} with an error message', () => {
    const result = validateScenarioFile({ bad: true })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('version')
  })

  it('rejects wrong version', () => {
    const file = { ...makeValidFile(), version: 2 }
    const result = validateScenarioFile(file)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('version')
  })

  it('rejects missing name', () => {
    const file = { ...makeValidFile(), name: '' }
    const result = validateScenarioFile(file)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('name')
  })

  it('rejects invalid granularity', () => {
    const file = { ...makeValidFile(), granularity: 'weekly' }
    const result = validateScenarioFile(file)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('granularity')
  })

  it('rejects empty consumers array', () => {
    const file = { ...makeValidFile(), consumers: [] }
    const result = validateScenarioFile(file)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('Consumers')
  })

  it('rejects consumer with wrong shape length', () => {
    const file = makeValidFile()
    const badConsumers = [{ ...file.consumers[0], shape: [1, 2, 3] }]
    const result = validateScenarioFile({ ...file, consumers: badConsumers })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('shape')
      expect(result.error).toContain('3')
    }
  })

  it('rejects consumer missing uid', () => {
    const file = makeValidFile()
    const { uid: _, ...rest } = file.consumers[0]
    const result = validateScenarioFile({ ...file, consumers: [rest] })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('uid')
  })

  it('rejects empty generators array', () => {
    const file = { ...makeValidFile(), generators: [] }
    const result = validateScenarioFile(file)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('Generators')
  })

  it('rejects generator missing technology', () => {
    const file = makeValidFile()
    const { technology: _, ...rest } = file.generators[0]
    const result = validateScenarioFile({ ...file, generators: [rest] })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('technology')
  })

  it('rejects generator with invalid capacityFactor', () => {
    const file = makeValidFile()
    const badGens = [{ ...file.generators[0], capacityFactor: NaN }]
    const result = validateScenarioFile({ ...file, generators: badGens })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('capacityFactor')
  })

  it('rejects missing matrix', () => {
    const file = { ...makeValidFile(), matrix: undefined }
    const result = validateScenarioFile(file)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('Matrix')
  })

  it('rejects matrix that is an array', () => {
    const file = { ...makeValidFile(), matrix: [] }
    const result = validateScenarioFile(file)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('Matrix')
  })
})

describe('M7: backward-compatible import of pre-M7 files', () => {
  it('accepts a valid version-1 file without allocationMode or consumptionMatrix', () => {
    const file = makeValidFile()
    // Simulate a pre-M7 file: no allocationMode or consumptionMatrix
    const { allocationMode: _a, consumptionMatrix: _c, ...preM7File } = file as Record<string, unknown>
    const result = validateScenarioFile(preM7File)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const state = scenarioFileToPortfolioState(result.file)
    expect(state.allocationMode).toBe('generator-share')
    // consumptionMatrix should exist with zero entries for all generator-consumer pairs
    expect(state.consumptionMatrix).toBeDefined()
    expect(state.consumptionMatrix['g1']['c1']).toBe(0)
  })

  it('preserves allocationMode and consumptionMatrix when present', () => {
    const file = {
      ...makeValidFile(),
      allocationMode: 'consumption-share' as const,
      consumptionMatrix: { g1: { c1: 25 } },
    }
    const result = validateScenarioFile(file)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const state = scenarioFileToPortfolioState(result.file)
    expect(state.allocationMode).toBe('consumption-share')
    expect(state.consumptionMatrix['g1']['c1']).toBe(25)
  })
})

describe('round-trip: export -> validate -> import', () => {
  it('preserves the demo portfolio through export and re-import', async () => {
    const original = await createDemoPortfolio()
    const exported = exportScenarioFile('Demo round-trip', original)

    const validated = validateScenarioFile(exported)
    expect(validated.ok).toBe(true)
    if (!validated.ok) return

    const restored = scenarioFileToPortfolioState(validated.file)

    // Consumers match
    expect(restored.consumers.length).toBe(original.consumers.length)
    for (let i = 0; i < original.consumers.length; i++) {
      expect(restored.consumers[i].uid).toBe(original.consumers[i].uid)
      expect(restored.consumers[i].name).toBe(original.consumers[i].name)
      expect(restored.consumers[i].annualMWh).toBe(original.consumers[i].annualMWh)
      expect(restored.consumers[i].shape.length).toBe(HOURS_PER_YEAR)
      expect(restored.consumers[i].shape[0]).toBe(original.consumers[i].shape[0])
    }

    // Generators match
    expect(restored.generators.length).toBe(original.generators.length)
    for (let i = 0; i < original.generators.length; i++) {
      expect(restored.generators[i].uid).toBe(original.generators[i].uid)
      expect(restored.generators[i].name).toBe(original.generators[i].name)
      expect(restored.generators[i].annualMWh).toBe(original.generators[i].annualMWh)
      expect(restored.generators[i].technology).toBe(original.generators[i].technology)
      expect(restored.generators[i].capacityFactor).toBe(original.generators[i].capacityFactor)
      expect(restored.generators[i].shape.length).toBe(HOURS_PER_YEAR)
    }

    // Matrix matches
    expect(restored.matrix).toEqual(original.matrix)

    // Granularity matches
    expect(restored.granularity).toBe(original.granularity)
  })
})
