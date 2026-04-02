import { describe, it, expect } from 'vitest'
import { scaleProfile, calculateHourlyMatching } from './matching'
import type { Profile, GenerationMix } from '../types'

function makeProfile(
  data: number[],
  overrides: Partial<Profile> = {}
): Profile {
  return {
    id: 'test-profile',
    name: 'Test Profile',
    category: 'consumption',
    region: 'UK',
    technology: 'test',
    description: 'Test profile',
    data,
    ...overrides,
  }
}

function makeUniformProfile(value: number, length = 8760): number[] {
  return new Array(length).fill(value)
}

describe('scaleProfile', () => {
  it('scales a normalised profile by percentage and total consumption', () => {
    const normalised = makeUniformProfile(1 / 8760)
    const profile = makeProfile(normalised)

    const scaled = scaleProfile(profile, 50, 1000)
    const sum = scaled.reduce((a, b) => a + b, 0)

    expect(sum).toBeCloseTo(500, 5)
  })

  it('returns zeros when percentage is 0', () => {
    const normalised = makeUniformProfile(1 / 8760)
    const profile = makeProfile(normalised)

    const scaled = scaleProfile(profile, 0, 1000)
    const sum = scaled.reduce((a, b) => a + b, 0)

    expect(sum).toBe(0)
  })

  it('allows over-procurement (200%)', () => {
    const normalised = makeUniformProfile(1 / 8760)
    const profile = makeProfile(normalised)

    const scaled = scaleProfile(profile, 200, 1000)
    const sum = scaled.reduce((a, b) => a + b, 0)

    expect(sum).toBeCloseTo(2000, 5)
  })
})

describe('calculateHourlyMatching', () => {
  it('returns 100% CFE when generation profile matches consumption exactly', () => {
    const data = makeUniformProfile(1 / 8760)
    const consumption = makeProfile(data, { category: 'consumption' })
    const generation = makeProfile([...data], {
      id: 'gen',
      category: 'generation',
      technology: 'wind',
    })

    const mix: GenerationMix = { wind: 100 }
    const result = calculateHourlyMatching(consumption, mix, [generation])

    expect(result.cfeScore).toBeCloseTo(100, 5)
  })

  it('returns <100% CFE when flat generation meets peaky consumption', () => {
    // Peaky consumption: high in first half, zero in second half
    const peakyData = new Array(8760).fill(0)
    for (let i = 0; i < 4380; i++) {
      peakyData[i] = 1 / 4380
    }
    const consumption = makeProfile(peakyData, { category: 'consumption' })

    // Flat generation
    const flatData = makeUniformProfile(1 / 8760)
    const generation = makeProfile(flatData, {
      id: 'gen',
      category: 'generation',
      technology: 'wind',
    })

    const mix: GenerationMix = { wind: 100 }
    const result = calculateHourlyMatching(consumption, mix, [generation])

    expect(result.cfeScore).toBeLessThan(100)
    expect(result.cfeScore).toBeGreaterThan(0)
  })

  it('caps surplus generation per hour (no banking)', () => {
    // 2-hour simplified test using 8760-length arrays
    const consumptionData = new Array(8760).fill(0)
    consumptionData[0] = 0.5 // 1 unit equivalent
    consumptionData[1] = 0.5 // 1 unit equivalent

    const generationData = new Array(8760).fill(0)
    generationData[0] = 1.0 // 2 units equivalent (surplus of 1)
    generationData[1] = 0.0 // 0 units (deficit of 1)

    const consumption = makeProfile(consumptionData, { category: 'consumption' })
    const generation = makeProfile(generationData, {
      id: 'gen',
      category: 'generation',
      technology: 'wind',
    })

    const mix: GenerationMix = { wind: 100 }
    const result = calculateHourlyMatching(consumption, mix, [generation])

    // matched[0] = min(gen[0]*totalConsumption, cons[0]) = min(1.0*1.0, 0.5) = 0.5
    // matched[1] = min(gen[1]*totalConsumption, cons[1]) = min(0.0, 0.5) = 0
    // cfeScore = 0.5 / 1.0 * 100 = 50%
    expect(result.cfeScore).toBeCloseTo(50, 5)
    expect(result.hourlyMatched[0]).toBeCloseTo(0.5, 5)
    expect(result.hourlyMatched[1]).toBeCloseTo(0, 5)
  })

  it('returns 0% CFE when all sliders are at 0', () => {
    const data = makeUniformProfile(1 / 8760)
    const consumption = makeProfile(data, { category: 'consumption' })
    const generation = makeProfile([...data], {
      id: 'gen',
      category: 'generation',
      technology: 'wind',
    })

    const mix: GenerationMix = { wind: 0 }
    const result = calculateHourlyMatching(consumption, mix, [generation])

    expect(result.cfeScore).toBe(0)
  })

  it('returns monthlyScores array with 12 values between 0 and 100', () => {
    const data = makeUniformProfile(1 / 8760)
    const consumption = makeProfile(data, { category: 'consumption' })
    const generation = makeProfile([...data], {
      id: 'gen',
      category: 'generation',
      technology: 'wind',
    })

    const mix: GenerationMix = { wind: 100 }
    const result = calculateHourlyMatching(consumption, mix, [generation])

    expect(result.monthlyScores).toHaveLength(12)
    for (const score of result.monthlyScores) {
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    }
  })

  it('combines multiple generation technologies', () => {
    // Half consumption in first half, half in second half
    const consumptionData = new Array(8760).fill(1 / 8760)
    const consumption = makeProfile(consumptionData, { category: 'consumption' })

    // Wind covers first half
    const windData = new Array(8760).fill(0)
    for (let i = 0; i < 4380; i++) windData[i] = 1 / 4380

    // Solar covers second half
    const solarData = new Array(8760).fill(0)
    for (let i = 4380; i < 8760; i++) solarData[i] = 1 / 4380

    const wind = makeProfile(windData, {
      id: 'wind',
      category: 'generation',
      technology: 'wind',
    })
    const solar = makeProfile(solarData, {
      id: 'solar',
      category: 'generation',
      technology: 'solar',
    })

    const mix: GenerationMix = { wind: 50, solar: 50 }
    const result = calculateHourlyMatching(consumption, mix, [wind, solar])

    // Each tech provides 50% scaled, covering different halves
    // Should achieve close to 100% matching
    expect(result.cfeScore).toBeCloseTo(100, 0)
  })
})
