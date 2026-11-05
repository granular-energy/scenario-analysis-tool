import { describe, expect, it } from 'vitest'
import { migratePortfolioState } from '../persistence'

describe('migratePortfolioState', () => {
  it('migrates old capacityMW schema to annualMWh', () => {
    const oldState = {
      consumers: [
        {
          uid: 'c1',
          profileId: 'data-centre',
          name: 'Data centre',
          annualMWh: 50000,
          shape: [],
          source: 'library',
        },
      ],
      generators: [
        {
          uid: 'g1',
          profileId: 'solar-pv-temperate',
          name: 'Solar PV temperate',
          capacityMW: 25,
          capacityFactor: 0.11,
          technology: 'solar',
          shape: [],
          source: 'library',
        },
        {
          uid: 'g2',
          profileId: 'wind-onshore-temperate',
          name: 'Wind onshore temperate',
          capacityMW: 10,
          capacityFactor: 0.3,
          technology: 'wind-onshore',
          shape: [],
          source: 'library',
        },
      ],
      matrix: { g1: { c1: 100 }, g2: { c1: 100 } },
      granularity: 'hourly',
    }

    const migrated = migratePortfolioState(oldState as unknown as Record<string, unknown>)

    // Generators should now have annualMWh
    const gen1 = migrated.generators[0]
    const gen2 = migrated.generators[1]

    expect(gen1.annualMWh).toBe(Math.round(25 * 0.11 * 8760)) // 24090
    expect(gen2.annualMWh).toBe(Math.round(10 * 0.3 * 8760)) // 26280

    // capacityMW should be removed
    expect('capacityMW' in gen1).toBe(false)
    expect('capacityMW' in gen2).toBe(false)

    // capacityFactor should be retained
    expect(gen1.capacityFactor).toBe(0.11)
    expect(gen2.capacityFactor).toBe(0.3)
  })

  it('does not modify already-migrated state', () => {
    const newState = {
      consumers: [],
      generators: [
        {
          uid: 'g1',
          annualMWh: 24090,
          capacityFactor: 0.11,
          technology: 'solar',
          shape: [],
          source: 'library',
        },
      ],
      matrix: {},
      granularity: 'hourly',
    }

    const result = migratePortfolioState(newState as unknown as Record<string, unknown>)
    expect(result.generators[0].annualMWh).toBe(24090)
  })
})
