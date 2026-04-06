import { describe, it, expect } from 'vitest'
import { calculateConsumerMatching } from './matching-v2'
import type { PortfolioProfile, AllocationMatrix, DateRange } from '../types'

const HOUR_MS = 3_600_000
const BASE = Date.UTC(2025, 0, 1, 0, 0, 0)

function makeProfile(
  id: string,
  role: 'consumer' | 'generator',
  values: number[],
  start = BASE
): PortfolioProfile {
  return {
    id,
    name: id,
    role,
    timeSeries: {
      timestamps: values.map((_, i) => start + i * HOUR_MS),
      values,
      resolution: 'hourly',
    },
  }
}

describe('calculateConsumerMatching', () => {
  it('returns 100% CFE when generation exactly matches consumption', () => {
    const consumer = makeProfile('c1', 'consumer', [10, 10, 10, 10])
    const gen = makeProfile('g1', 'generator', [10, 10, 10, 10])
    const matrix: AllocationMatrix = { g1: { c1: 100 } }
    const range: DateRange = { start: BASE, end: BASE + 3 * HOUR_MS }

    const result = calculateConsumerMatching(consumer, [gen], matrix, range)
    expect(result.cfeScore).toBe(100)
    expect(result.annualScore).toBe(100)
  })

  it('caps matching at consumption (no banking of surplus)', () => {
    const consumer = makeProfile('c1', 'consumer', [5, 5, 5, 5])
    const gen = makeProfile('g1', 'generator', [20, 0, 20, 0])
    const matrix: AllocationMatrix = { g1: { c1: 100 } }
    const range: DateRange = { start: BASE, end: BASE + 3 * HOUR_MS }

    const result = calculateConsumerMatching(consumer, [gen], matrix, range)
    // Hour 0: min(20, 5)=5, Hour 1: min(0, 5)=0, Hour 2: min(20, 5)=5, Hour 3: min(0, 5)=0
    // Total matched=10, total consumption=20
    expect(result.cfeScore).toBe(50)
    expect(result.hourlyMatchedMWh).toEqual([5, 0, 5, 0])
  })

  it('respects allocation percentage', () => {
    const consumer = makeProfile('c1', 'consumer', [10, 10])
    const gen = makeProfile('g1', 'generator', [20, 20])
    const matrix: AllocationMatrix = { g1: { c1: 50 } } // only 50% allocated
    const range: DateRange = { start: BASE, end: BASE + 1 * HOUR_MS }

    const result = calculateConsumerMatching(consumer, [gen], matrix, range)
    // Allocated = 20*0.5=10 per hour, consumption=10 → 100% match
    expect(result.cfeScore).toBe(100)
  })

  it('combines multiple generators', () => {
    const consumer = makeProfile('c1', 'consumer', [10, 10])
    const g1 = makeProfile('g1', 'generator', [6, 0])
    const g2 = makeProfile('g2', 'generator', [0, 8])
    const matrix: AllocationMatrix = {
      g1: { c1: 100 },
      g2: { c1: 100 },
    }
    const range: DateRange = { start: BASE, end: BASE + 1 * HOUR_MS }

    const result = calculateConsumerMatching(consumer, [g1, g2], matrix, range)
    // Hour 0: min(6+0, 10)=6, Hour 1: min(0+8, 10)=8
    // Total matched=14, total consumption=20
    expect(result.cfeScore).toBe(70)
  })

  it('returns zero scores when no allocation', () => {
    const consumer = makeProfile('c1', 'consumer', [10, 10])
    const gen = makeProfile('g1', 'generator', [10, 10])
    const matrix: AllocationMatrix = {} // no allocations
    const range: DateRange = { start: BASE, end: BASE + 1 * HOUR_MS }

    const result = calculateConsumerMatching(consumer, [gen], matrix, range)
    expect(result.cfeScore).toBe(0)
    expect(result.annualScore).toBe(0)
  })

  it('returns empty result when date range yields no data', () => {
    const consumer = makeProfile('c1', 'consumer', [10, 10])
    const gen = makeProfile('g1', 'generator', [10, 10])
    const matrix: AllocationMatrix = { g1: { c1: 100 } }
    const range: DateRange = {
      start: BASE + 100 * HOUR_MS,
      end: BASE + 200 * HOUR_MS,
    }

    const result = calculateConsumerMatching(consumer, [gen], matrix, range)
    expect(result.cfeScore).toBe(0)
    expect(result.hourlyMatchedMWh).toEqual([])
  })

  it('produces hourly matching percentages', () => {
    const consumer = makeProfile('c1', 'consumer', [10, 20, 0])
    const gen = makeProfile('g1', 'generator', [5, 20, 10])
    const matrix: AllocationMatrix = { g1: { c1: 100 } }
    const range: DateRange = { start: BASE, end: BASE + 2 * HOUR_MS }

    const result = calculateConsumerMatching(consumer, [gen], matrix, range)
    expect(result.hourlyMatchingPercentage[0]).toBe(50)  // 5/10
    expect(result.hourlyMatchingPercentage[1]).toBe(100) // 20/20
    expect(result.hourlyMatchingPercentage[2]).toBe(0)   // 0 consumption
  })

  it('calculates generator contributions', () => {
    const consumer = makeProfile('c1', 'consumer', [10, 10])
    const g1 = makeProfile('g1', 'generator', [8, 8])
    const g2 = makeProfile('g2', 'generator', [4, 4])
    const matrix: AllocationMatrix = {
      g1: { c1: 100 },
      g2: { c1: 100 },
    }
    const range: DateRange = { start: BASE, end: BASE + 1 * HOUR_MS }

    const result = calculateConsumerMatching(consumer, [g1, g2], matrix, range)
    expect(result.generatorContributions.length).toBe(2)
    // Total gen = 12 per hour, matched = 10
    // g1 share = 8/12 ≈ 66.7%, g2 share = 4/12 ≈ 33.3%
    const g1Contrib = result.generatorContributions.find((c) => c.generatorId === 'g1')!
    expect(g1Contrib.totalAllocatedMWh).toBe(16) // 8*2 hours
  })
})
