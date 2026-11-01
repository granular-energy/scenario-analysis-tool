import Papa from 'papaparse'
import { HOURS_PER_YEAR } from '../engine/types'
import { slotFor } from '../engine/typicalYear'
import {
  detectDayMonthOrder,
  isValidWallClock,
  parseTimestamp,
  toZone,
  wallClockMinutes,
  type ParsedTimestamp,
  type WallClock,
} from './timestamps'

export type EnergyUnit = 'kWh' | 'MWh' | 'kW' | 'MW'
export type Resolution = 'hourly' | 'half-hourly'

export interface UploadOptions {
  /** IANA zone the data should be read in. Naive timestamps are taken as already being in this zone. */
  readonly timeZone: string
  readonly unit: EnergyUnit
}

export interface UploadNotice {
  readonly kind: 'leap-day-dropped' | 'dst-duplicate-summed' | 'dst-gap-filled' | 'rows-skipped'
  readonly message: string
}

export interface UploadResult {
  readonly hourlyMWh: number[]
  readonly resolution: Resolution
  readonly rowsUsed: number
  readonly firstTimestamp: WallClock
  readonly lastTimestamp: WallClock
  readonly notices: readonly UploadNotice[]
}

export class UploadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UploadError'
  }
}

interface Row {
  readonly time: ParsedTimestamp
  readonly value: number
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function formatWallClock(t: WallClock): string {
  return `${t.year}-${pad(t.month)}-${pad(t.day)} ${pad(t.hour)}:${pad(t.minute)}`
}

function parseRows(text: string): { rows: Row[]; skipped: number } {
  const parsed = Papa.parse<string[]>(text.trim(), { skipEmptyLines: true })
  const records = parsed.data.filter((r) => r.length >= 2)
  if (records.length === 0) throw new UploadError('The file has no rows with a timestamp and a value.')

  const order = detectDayMonthOrder(records.slice(0, 500).map((r) => r[0]))
  const rows: Row[] = []
  let skipped = 0
  for (const record of records) {
    const time = parseTimestamp(record[0], order)
    const value = Number(String(record[1]).replace(/,/g, '').trim())
    if (!time || !isValidWallClock(time) || !Number.isFinite(value)) {
      skipped++ // header rows and blanks land here
      continue
    }
    rows.push({ time, value })
  }
  if (rows.length === 0) {
    throw new UploadError(
      'No rows could be read. Expected two columns: a timestamp (e.g. 2025-01-01 00:00 or 01/01/2025 00:00) and a number.',
    )
  }
  return { rows, skipped }
}

function detectResolution(rows: readonly Row[]): { resolution: Resolution; stepMinutes: number } {
  const gaps: number[] = []
  for (let i = 1; i < Math.min(rows.length, 2000); i++) {
    const gap = wallClockMinutes(rows[i].time) - wallClockMinutes(rows[i - 1].time)
    if (gap > 0) gaps.push(gap)
  }
  if (gaps.length === 0) throw new UploadError('Could not work out the time step between rows.')
  gaps.sort((a, b) => a - b)
  const median = gaps[Math.floor(gaps.length / 2)]
  if (median === 60) return { resolution: 'hourly', stepMinutes: 60 }
  if (median === 30) return { resolution: 'half-hourly', stepMinutes: 30 }
  throw new UploadError(
    `Rows are ${median} minutes apart; only hourly (60) or half-hourly (30) data is supported.`,
  )
}

function toMWh(value: number, unit: EnergyUnit, stepMinutes: number): number {
  const hours = stepMinutes / 60
  switch (unit) {
    case 'MWh':
      return value
    case 'kWh':
      return value / 1000
    case 'MW':
      return value * hours
    case 'kW':
      return (value * hours) / 1000
  }
}

/**
 * Parse a two-column CSV (timestamp, value) into a typical-year hourly MWh series.
 * Rejects anything that does not fill all 8,760 slots from 12 contiguous months.
 */
export function parseProfileCsv(text: string, options: UploadOptions): UploadResult {
  const { rows, skipped } = parseRows(text)
  const { resolution, stepMinutes } = detectResolution(rows)
  const notices: UploadNotice[] = []
  if (skipped > 0) {
    notices.push({
      kind: 'rows-skipped',
      message: `${skipped} row(s) without a valid timestamp and number were ignored.`,
    })
  }

  const slotTotals = new Array<number>(HOURS_PER_YEAR).fill(0)
  const slotCounts = new Array<number>(HOURS_PER_YEAR).fill(0)
  const expectedPerSlot = stepMinutes === 30 ? 2 : 1
  let leapRows = 0
  let first: WallClock | undefined
  let last: WallClock | undefined
  const monthsSeen = new Set<string>()

  for (const row of rows) {
    const local = toZone(row.time, options.timeZone)
    first ??= local
    last = local
    monthsSeen.add(`${local.year}-${local.month}`)
    const slot = slotFor(local.month, local.day, local.hour)
    if (slot < 0) {
      leapRows++
      continue
    }
    slotTotals[slot] += toMWh(row.value, options.unit, stepMinutes)
    slotCounts[slot]++
  }
  if (leapRows > 0) {
    notices.push({
      kind: 'leap-day-dropped',
      message: `${leapRows} row(s) on 29 February were dropped; the typical year has 365 days.`,
    })
  }

  if (monthsSeen.size > 13) {
    throw new UploadError(
      `The file spans ${monthsSeen.size} calendar months. Upload exactly 12 contiguous months (a partial first and last month are allowed only if together they complete the year).`,
    )
  }

  const missing: number[] = []
  let duplicates = 0
  for (let slot = 0; slot < HOURS_PER_YEAR; slot++) {
    if (slotCounts[slot] === 0) missing.push(slot)
    else if (slotCounts[slot] > expectedPerSlot) duplicates++
  }
  if (duplicates > 0) {
    notices.push({
      kind: 'dst-duplicate-summed',
      message: `${duplicates} hour(s) appeared more than once (clocks going back); their values were added together.`,
    })
  }

  // A single missing hour next to filled hours is the spring-forward gap; anything more is real missing data.
  if (missing.length === 1) {
    const slot = missing[0]
    const before = slotTotals[(slot + HOURS_PER_YEAR - 1) % HOURS_PER_YEAR]
    const after = slotTotals[(slot + 1) % HOURS_PER_YEAR]
    slotTotals[slot] = (before + after) / 2
    notices.push({
      kind: 'dst-gap-filled',
      message: 'One missing hour (clocks going forward) was filled with the average of its neighbours.',
    })
  } else if (missing.length > 1) {
    const describe = (slot: number) => {
      // Reverse of slotFor: walk months to find the calendar position of this slot
      const months = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
      let remaining = slot
      for (let m = 0; m < 12; m++) {
        if (remaining < months[m] * 24)
          return `${pad(Math.floor(remaining / 24) + 1)}/${pad(m + 1)} ${pad(remaining % 24)}:00`
        remaining -= months[m] * 24
      }
      return `slot ${slot}`
    }
    throw new UploadError(
      `${missing.length} of 8,760 hours are missing (first gap at ${describe(missing[0])}, last at ${describe(missing[missing.length - 1])}). Upload 12 contiguous months with no gaps.`,
    )
  }

  return {
    hourlyMWh: slotTotals,
    resolution,
    rowsUsed: rows.length - leapRows,
    firstTimestamp: first!,
    lastTimestamp: last!,
    notices,
  }
}
