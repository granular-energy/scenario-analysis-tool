import { describe, it, expect } from 'vitest'
import { detectResolution, computeOverlapRange, filterToRange, toHourly } from './timeseries'
import type { TimeSeries, PortfolioProfile } from '../types'

const HOUR_MS = 3_600_000
const HALF_HOUR_MS = 1_800_000
const BASE = Date.UTC(2025, 0, 1, 0, 0, 0) // 2025-01-01 00:00 UTC

function makeTimestamps(count: number, intervalMs: number, start = BASE): number[] {
  return Array.from({ length: count }, (_, i) => start + i * intervalMs)
}

function makeProfile(
  role: 'consumer' | 'generator',
  count: number,
  intervalMs: number,
  start = BASE,
  valuePerInterval = 1
): PortfolioProfile {
  const resolution = intervalMs === HALF_HOUR_MS ? 'half-hourly' as const : 'hourly' as const
  return {
    id: `test-${role}`,
    name: `Test ${role}`,
    role,
    timeSeries: {
      timestamps: makeTimestamps(count, intervalMs, start),
      values: new Array(count).fill(valuePerInterval),
      resolution,
    },
  }
}

describe('detectResolution', () => {
  it('detects hourly resolution', () => {
    const ts = makeTimestamps(100, HOUR_MS)
    expect(detectResolution(ts)).toBe('hourly')
  })

  it('detects half-hourly resolution', () => {
    const ts = makeTimestamps(100, HALF_HOUR_MS)
    expect(detectResolution(ts)).toBe('half-hourly')
  })

  it('returns hourly for a single timestamp', () => {
    expect(detectResolution([BASE])).toBe('hourly')
  })

  it('throws for unsupported resolution', () => {
    const ts = makeTimestamps(100, 900_000) // 15-minute
    expect(() => detectResolution(ts)).toThrow('Unable to detect resolution')
  })
})

describe('computeOverlapRange', () => {
  it('returns null for empty array', () => {
    expect(computeOverlapRange([])).toBeNull()
  })

  it('returns the full range for a single profile', () => {
    const p = makeProfile('consumer', 24, HOUR_MS)
    const range = computeOverlapRange([p])
    expect(range).toEqual({
      start: BASE,
      end: BASE + 23 * HOUR_MS,
    })
  })

  it('computes overlap of two profiles with different start/end', () => {
    const p1 = makeProfile('consumer', 48, HOUR_MS, BASE)
    const p2 = makeProfile('generator', 48, HOUR_MS, BASE + 12 * HOUR_MS)
    const range = computeOverlapRange([p1, p2])
    expect(range!.start).toBe(BASE + 12 * HOUR_MS)
    expect(range!.end).toBe(BASE + 47 * HOUR_MS)
  })

  it('returns null when profiles do not overlap', () => {
    const p1 = makeProfile('consumer', 24, HOUR_MS, BASE)
    const p2 = makeProfile('generator', 24, HOUR_MS, BASE + 100 * HOUR_MS)
    expect(computeOverlapRange([p1, p2])).toBeNull()
  })
})

describe('filterToRange', () => {
  it('returns full timeseries when range covers everything', () => {
    const ts: TimeSeries = {
      timestamps: makeTimestamps(24, HOUR_MS),
      values: Array.from({ length: 24 }, (_, i) => i),
      resolution: 'hourly',
    }
    const range = { start: BASE, end: BASE + 23 * HOUR_MS }
    const filtered = filterToRange(ts, range)
    expect(filtered.values.length).toBe(24)
  })

  it('filters to a subset', () => {
    const ts: TimeSeries = {
      timestamps: makeTimestamps(24, HOUR_MS),
      values: Array.from({ length: 24 }, (_, i) => i),
      resolution: 'hourly',
    }
    const range = { start: BASE + 5 * HOUR_MS, end: BASE + 10 * HOUR_MS }
    const filtered = filterToRange(ts, range)
    expect(filtered.values.length).toBe(6)
    expect(filtered.values[0]).toBe(5)
    expect(filtered.values[5]).toBe(10)
  })

  it('returns empty when range is outside data', () => {
    const ts: TimeSeries = {
      timestamps: makeTimestamps(24, HOUR_MS),
      values: new Array(24).fill(1),
      resolution: 'hourly',
    }
    const range = { start: BASE + 100 * HOUR_MS, end: BASE + 200 * HOUR_MS }
    const filtered = filterToRange(ts, range)
    expect(filtered.values.length).toBe(0)
  })
})

describe('toHourly', () => {
  it('returns hourly data unchanged', () => {
    const ts: TimeSeries = {
      timestamps: makeTimestamps(24, HOUR_MS),
      values: new Array(24).fill(1),
      resolution: 'hourly',
    }
    const result = toHourly(ts)
    expect(result).toBe(ts) // same reference
  })

  it('aggregates half-hourly pairs into hourly', () => {
    const ts: TimeSeries = {
      timestamps: makeTimestamps(48, HALF_HOUR_MS),
      values: new Array(48).fill(0.5), // 0.5 MWh per half-hour
      resolution: 'half-hourly',
    }
    const result = toHourly(ts)
    expect(result.values.length).toBe(24)
    expect(result.resolution).toBe('hourly')
    // Each hourly value = 0.5 + 0.5 = 1.0
    expect(result.values[0]).toBe(1.0)
    expect(result.values[23]).toBe(1.0)
  })

  it('handles odd number of half-hourly values', () => {
    const ts: TimeSeries = {
      timestamps: makeTimestamps(5, HALF_HOUR_MS),
      values: [1, 2, 3, 4, 5],
      resolution: 'half-hourly',
    }
    const result = toHourly(ts)
    expect(result.values).toEqual([3, 7, 5]) // [1+2, 3+4, 5+0]
  })
})
