import { describe, expect, it } from 'vitest'
import { sliceDay, dateToDayIndex, dayIndexToDate, DEFAULT_DAY_INDEX } from '../exampleDayConfig'

describe('sliceDay', () => {
  it('extracts 24 hours for day 0', () => {
    const series = Array.from({ length: 8760 }, (_, i) => i)
    const result = sliceDay(series, 0)
    expect(result).toHaveLength(24)
    expect(result[0]).toBe(0)
    expect(result[23]).toBe(23)
  })

  it('extracts correct hours for day 120', () => {
    const series = Array.from({ length: 8760 }, (_, i) => i)
    const result = sliceDay(series, 120)
    expect(result).toHaveLength(24)
    expect(result[0]).toBe(120 * 24)
    expect(result[23]).toBe(120 * 24 + 23)
  })
})

describe('dateToDayIndex', () => {
  it('returns 0 for 1 January', () => {
    expect(dateToDayIndex(1, 1)).toBe(0)
  })

  it('returns 120 for 1 May', () => {
    // 31 (Jan) + 28 (Feb) + 31 (Mar) + 30 (Apr) = 120
    expect(dateToDayIndex(5, 1)).toBe(120)
  })

  it('returns 364 for 31 December', () => {
    expect(dateToDayIndex(12, 31)).toBe(364)
  })
})

describe('dayIndexToDate', () => {
  it('converts 0 to 1 January', () => {
    expect(dayIndexToDate(0)).toEqual({ month: 1, day: 1 })
  })

  it('converts 120 to 1 May', () => {
    expect(dayIndexToDate(120)).toEqual({ month: 5, day: 1 })
  })

  it('round-trips correctly', () => {
    for (let d = 0; d < 365; d++) {
      const { month, day } = dayIndexToDate(d)
      expect(dateToDayIndex(month, day)).toBe(d)
    }
  })
})

describe('DEFAULT_DAY_INDEX', () => {
  it('is 120 (1 May)', () => {
    expect(DEFAULT_DAY_INDEX).toBe(120)
  })
})
