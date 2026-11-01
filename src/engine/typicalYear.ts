import { HOURS_PER_YEAR } from './types'

export const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const

export const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

/** Slot index at which each month starts, plus a final entry equal to HOURS_PER_YEAR. */
export const MONTH_START_HOUR: readonly number[] = DAYS_IN_MONTH.reduce<number[]>(
  (acc, days) => [...acc, acc[acc.length - 1] + days * 24],
  [0],
)

export interface Window {
  readonly start: number
  readonly end: number // exclusive
}

export function monthWindows(): Window[] {
  return DAYS_IN_MONTH.map((_, m) => ({ start: MONTH_START_HOUR[m], end: MONTH_START_HOUR[m + 1] }))
}

export function hourWindows(): Window[] {
  const windows: Window[] = new Array(HOURS_PER_YEAR)
  for (let h = 0; h < HOURS_PER_YEAR; h++) windows[h] = { start: h, end: h + 1 }
  return windows
}

export const YEAR_WINDOW: Window = { start: 0, end: HOURS_PER_YEAR }

/** Typical-year slot for a (1-based month, 1-based day, 0–23 hour). 29 Feb has no slot and returns -1. */
export function slotFor(month: number, day: number, hour: number): number {
  if (month < 1 || month > 12 || hour < 0 || hour > 23) return -1
  if (day < 1 || day > DAYS_IN_MONTH[month - 1]) return -1
  return MONTH_START_HOUR[month - 1] + (day - 1) * 24 + hour
}

export function monthOfSlot(slot: number): number {
  let m = 0
  while (m < 11 && slot >= MONTH_START_HOUR[m + 1]) m++
  return m
}

export function sumByMonth(series: readonly number[]): number[] {
  const out = new Array<number>(12).fill(0)
  for (let m = 0; m < 12; m++) {
    let total = 0
    for (let h = MONTH_START_HOUR[m]; h < MONTH_START_HOUR[m + 1]; h++) total += series[h]
    out[m] = total
  }
  return out
}

export function sum(series: readonly number[]): number {
  let total = 0
  for (let i = 0; i < series.length; i++) total += series[i]
  return total
}
