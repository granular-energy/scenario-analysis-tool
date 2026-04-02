import { describe, it, expect } from 'vitest'
import { consumptionProfiles } from './consumption'
import { generationProfiles } from './generation'

describe('consumption profiles', () => {
  it('should have exactly 3 profiles', () => {
    expect(consumptionProfiles).toHaveLength(3)
  })

  it.each(
    consumptionProfiles.map((p) => [p.id, p])
  )('%s has 8760 values summing to ~1.0', (_id, profile) => {
    expect(profile.data).toHaveLength(8760)
    const sum = profile.data.reduce((a: number, b: number) => a + b, 0)
    expect(Math.abs(sum - 1.0)).toBeLessThan(0.001)
  })
})

describe('generation profiles', () => {
  it('should have exactly 3 profiles', () => {
    expect(generationProfiles).toHaveLength(3)
  })

  it.each(
    generationProfiles.map((p) => [p.id, p])
  )('%s has 8760 values summing to ~1.0', (_id, profile) => {
    expect(profile.data).toHaveLength(8760)
    const sum = profile.data.reduce((a: number, b: number) => a + b, 0)
    expect(Math.abs(sum - 1.0)).toBeLessThan(0.001)
  })
})
