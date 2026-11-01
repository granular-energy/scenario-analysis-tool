/**
 * Timestamp parsing for uploaded profiles. Returns wall-clock components rather than an instant,
 * because the typical year has no timezone: a reading is placed by its local month/day/hour.
 */

export interface WallClock {
  readonly year: number
  readonly month: number // 1–12
  readonly day: number // 1–31
  readonly hour: number // 0–23
  readonly minute: number // 0–59
}

export interface ParsedTimestamp extends WallClock {
  /** Offset in minutes east of UTC when the text carried one (Z, +01:00); undefined for naive timestamps. */
  readonly offsetMinutes?: number
}

export type DayMonthOrder = 'day-first' | 'month-first'

const ISO = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i
const ISO_DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/
const SLASHED = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?$/
const YMD_SLASHED = /^(\d{4})\/(\d{1,2})\/(\d{1,2})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?$/

function parseOffset(text: string | undefined): number | undefined {
  if (!text) return undefined
  if (text.toUpperCase() === 'Z') return 0
  const sign = text[0] === '-' ? -1 : 1
  const digits = text.slice(1).replace(':', '')
  return sign * (Number(digits.slice(0, 2)) * 60 + Number(digits.slice(2, 4)))
}

export function parseTimestamp(raw: string, order: DayMonthOrder): ParsedTimestamp | null {
  const text = raw.trim()
  let m = ISO.exec(text)
  if (m) {
    return {
      year: +m[1],
      month: +m[2],
      day: +m[3],
      hour: +m[4],
      minute: +m[5],
      offsetMinutes: parseOffset(m[7]),
    }
  }
  m = ISO_DATE_ONLY.exec(text)
  if (m) return { year: +m[1], month: +m[2], day: +m[3], hour: 0, minute: 0 }
  m = YMD_SLASHED.exec(text)
  if (m) return { year: +m[1], month: +m[2], day: +m[3], hour: +m[4], minute: +m[5] }
  m = SLASHED.exec(text)
  if (m) {
    const [a, b] = [+m[1], +m[2]]
    const [day, month] = order === 'day-first' ? [a, b] : [b, a]
    return { year: +m[3], month, day, hour: +m[4], minute: +m[5] }
  }
  return null
}

/**
 * Decide whether slashed dates are day-first or month-first by looking for a field above 12.
 * Defaults to day-first (British) when every value is ambiguous.
 */
export function detectDayMonthOrder(samples: readonly string[]): DayMonthOrder {
  for (const raw of samples) {
    const m = SLASHED.exec(raw.trim())
    if (!m) continue
    if (+m[1] > 12) return 'day-first'
    if (+m[2] > 12) return 'month-first'
  }
  return 'day-first'
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

export function isValidWallClock(t: WallClock): boolean {
  if (t.month < 1 || t.month > 12 || t.hour < 0 || t.hour > 23 || t.minute < 0 || t.minute > 59) return false
  const days = t.month === 2 && isLeapYear(t.year) ? 29 : DAYS_IN_MONTH[t.month - 1]
  return t.day >= 1 && t.day <= days
}

/** Minutes since the epoch treating the wall clock as UTC; only used for ordering and gap detection. */
export function wallClockMinutes(t: WallClock): number {
  return Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute) / 60_000
}

/** Convert an instant (wall clock + offset) to the wall clock in the given IANA timezone. */
export function toZone(t: ParsedTimestamp, timeZone: string): WallClock {
  if (t.offsetMinutes === undefined) return t
  const epochMs = Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute) - t.offsetMinutes * 60_000
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).formatToParts(new Date(epochMs))
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute') }
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone })
    return true
  } catch {
    return false
  }
}
