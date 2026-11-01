import { describe, expect, it } from 'vitest'
import { HOURS_PER_YEAR } from '../../engine/types'
import { slotFor } from '../../engine/typicalYear'
import { parseProfileCsv, UploadError } from '../profileUpload'
import { detectDayMonthOrder, parseTimestamp, toZone } from '../timestamps'

const pad = (n: number) => String(n).padStart(2, '0')

/** Build a CSV covering a whole year at the given step, with a formatter for each timestamp. */
function yearCsv(
  year: number,
  stepMinutes: number,
  format: (d: Date) => string,
  value: (d: Date) => number = () => 1,
  header = 'timestamp,value',
): string {
  const lines = [header]
  const start = Date.UTC(year, 0, 1)
  const end = Date.UTC(year + 1, 0, 1)
  for (let t = start; t < end; t += stepMinutes * 60_000) {
    const d = new Date(t)
    lines.push(`${format(d)},${value(d)}`)
  }
  return lines.join('\n')
}

const isoNaive = (d: Date) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
const isoZulu = (d: Date) => d.toISOString().slice(0, 16) + 'Z'
const britishSlashed = (d: Date) =>
  `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`

const utc = { timeZone: 'UTC', unit: 'MWh' as const }

describe('parseTimestamp', () => {
  it('reads ISO with and without offsets', () => {
    expect(parseTimestamp('2025-03-30T01:00:00Z', 'day-first')).toMatchObject({ hour: 1, offsetMinutes: 0 })
    expect(parseTimestamp('2025-03-30T01:00:00+02:00', 'day-first')).toMatchObject({ offsetMinutes: 120 })
    expect(parseTimestamp('2025-03-30 01:00', 'day-first')).toMatchObject({
      day: 30,
      offsetMinutes: undefined,
    })
  })

  it('reads slashed dates in either order', () => {
    expect(parseTimestamp('05/03/2025 14:00', 'day-first')).toMatchObject({ day: 5, month: 3 })
    expect(parseTimestamp('05/03/2025 14:00', 'month-first')).toMatchObject({ day: 3, month: 5 })
    expect(detectDayMonthOrder(['01/01/2025 00:00', '13/01/2025 00:00'])).toBe('day-first')
    expect(detectDayMonthOrder(['01/01/2025 00:00', '01/13/2025 00:00'])).toBe('month-first')
    expect(detectDayMonthOrder(['01/01/2025 00:00'])).toBe('day-first')
  })

  it('rejects garbage', () => {
    expect(parseTimestamp('timestamp', 'day-first')).toBeNull()
  })
})

describe('toZone', () => {
  it('converts an instant to London wall clock across DST', () => {
    const winter = parseTimestamp('2025-01-15T12:00Z', 'day-first')!
    const summer = parseTimestamp('2025-07-15T12:00Z', 'day-first')!
    expect(toZone(winter, 'Europe/London')).toMatchObject({ hour: 12 })
    expect(toZone(summer, 'Europe/London')).toMatchObject({ hour: 13 })
  })

  it('leaves naive timestamps alone', () => {
    const naive = parseTimestamp('2025-07-15 12:00', 'day-first')!
    expect(toZone(naive, 'Europe/London')).toMatchObject({ hour: 12 })
  })
})

describe('parseProfileCsv', () => {
  it('maps a naive hourly UTC year onto the typical year', () => {
    const result = parseProfileCsv(yearCsv(2025, 60, isoNaive), utc)
    expect(result.resolution).toBe('hourly')
    expect(result.hourlyMWh).toHaveLength(HOURS_PER_YEAR)
    expect(result.hourlyMWh.every((v) => v === 1)).toBe(true)
    expect(result.notices.map((n) => n.kind)).toEqual(['rows-skipped']) // the header row
  })

  it('sums half-hourly rows into hours and converts units', () => {
    const kw = parseProfileCsv(
      yearCsv(2025, 30, isoNaive, () => 2000),
      { timeZone: 'UTC', unit: 'kW' },
    )
    expect(kw.resolution).toBe('half-hourly')
    expect(kw.hourlyMWh[0]).toBeCloseTo(2, 9) // 2000 kW for two half hours = 2 MWh
    const kwh = parseProfileCsv(
      yearCsv(2025, 60, isoNaive, () => 1500),
      { timeZone: 'UTC', unit: 'kWh' },
    )
    expect(kwh.hourlyMWh[0]).toBeCloseTo(1.5, 9)
  })

  it('reads British slashed dates', () => {
    const result = parseProfileCsv(
      yearCsv(2025, 60, britishSlashed, (d) => d.getUTCMonth() + 1),
      utc,
    )
    expect(result.hourlyMWh[slotFor(1, 1, 0)]).toBe(1)
    expect(result.hourlyMWh[slotFor(12, 31, 23)]).toBe(12)
  })

  it('converts offset timestamps into the chosen zone, handling both DST transitions', () => {
    // UTC instants viewed in London: 30 March 01:00 UTC is 02:00 BST, so wall-clock 01:00 never happens
    // (gap filled) and on 26 October wall-clock 01:00 happens twice (summed).
    const result = parseProfileCsv(yearCsv(2025, 60, isoZulu), { timeZone: 'Europe/London', unit: 'MWh' })
    const kinds = result.notices.map((n) => n.kind)
    expect(kinds).toContain('dst-gap-filled')
    expect(kinds).toContain('dst-duplicate-summed')
    expect(result.hourlyMWh[slotFor(3, 30, 1)]).toBe(1) // filled from neighbours
    expect(result.hourlyMWh[slotFor(10, 26, 1)]).toBe(2) // two instants map here
    // 8,760 rows of 1 MWh all land in a slot (the duplicate is summed, not dropped) plus one synthesised hour
    const total = result.hourlyMWh.reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(HOURS_PER_YEAR + 1, 6)
  })

  it('drops 29 February from a leap year with a notice', () => {
    const result = parseProfileCsv(yearCsv(2024, 60, isoNaive), utc)
    expect(result.notices.map((n) => n.kind)).toContain('leap-day-dropped')
    expect(result.rowsUsed).toBe(HOURS_PER_YEAR)
  })

  it('accepts a year that starts mid-way (July to June)', () => {
    const lines = ['time,mwh']
    for (let t = Date.UTC(2024, 6, 1); t < Date.UTC(2025, 6, 1); t += 3_600_000) {
      lines.push(`${isoNaive(new Date(t))},1`)
    }
    const result = parseProfileCsv(lines.join('\n'), utc)
    expect(result.rowsUsed).toBe(HOURS_PER_YEAR)
    expect(result.firstTimestamp).toMatchObject({ year: 2024, month: 7 })
  })

  it('rejects three months of data with a message naming the gap', () => {
    const lines = ['time,mwh']
    for (let t = Date.UTC(2025, 0, 1); t < Date.UTC(2025, 3, 1); t += 3_600_000) {
      lines.push(`${isoNaive(new Date(t))},1`)
    }
    expect(() => parseProfileCsv(lines.join('\n'), utc)).toThrow(UploadError)
    expect(() => parseProfileCsv(lines.join('\n'), utc)).toThrow(/missing/)
  })

  it('rejects 14 months of data', () => {
    const lines = ['time,mwh']
    for (let t = Date.UTC(2024, 11, 1); t < Date.UTC(2026, 1, 1); t += 3_600_000) {
      lines.push(`${isoNaive(new Date(t))},1`)
    }
    expect(() => parseProfileCsv(lines.join('\n'), utc)).toThrow(/12 contiguous months/)
  })

  it('rejects unsupported resolutions and empty files', () => {
    expect(() => parseProfileCsv(yearCsv(2025, 15, isoNaive), utc)).toThrow(/15 minutes/)
    expect(() => parseProfileCsv('timestamp,value\n', utc)).toThrow(UploadError)
  })
})
