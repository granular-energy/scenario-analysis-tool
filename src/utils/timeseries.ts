import type { TimeSeries, DateRange, PortfolioProfile, Resolution } from '../types'

const HOUR_MS = 3_600_000
const HALF_HOUR_MS = 1_800_000

/**
 * Detect resolution from consecutive timestamp gaps.
 * Returns 'hourly' or 'half-hourly', or throws if inconsistent.
 */
export function detectResolution(timestamps: number[]): Resolution {
  if (timestamps.length < 2) return 'hourly'

  // Sample up to 10 gaps for detection
  const sampleSize = Math.min(10, timestamps.length - 1)
  let totalGap = 0
  for (let i = 0; i < sampleSize; i++) {
    totalGap += timestamps[i + 1] - timestamps[i]
  }
  const medianGap = totalGap / sampleSize

  if (Math.abs(medianGap - HALF_HOUR_MS) < 300_000) return 'half-hourly'
  if (Math.abs(medianGap - HOUR_MS) < 300_000) return 'hourly'

  throw new Error(
    `Unable to detect resolution: average interval is ${Math.round(medianGap / 60_000)} minutes. ` +
    'Expected hourly (~60 min) or half-hourly (~30 min).'
  )
}

/**
 * Compute the overlapping date range across all profiles.
 * Returns null if there is no overlap.
 */
export function computeOverlapRange(profiles: PortfolioProfile[]): DateRange | null {
  if (profiles.length === 0) return null

  let start = -Infinity
  let end = Infinity

  for (const p of profiles) {
    const ts = p.timeSeries.timestamps
    if (ts.length === 0) continue
    const pStart = ts[0]
    const pEnd = ts[ts.length - 1]
    if (pStart > start) start = pStart
    if (pEnd < end) end = pEnd
  }

  if (start === -Infinity || end === Infinity || start >= end) return null
  return { start, end }
}

/**
 * Filter a timeseries to only include intervals within the given date range (inclusive).
 */
export function filterToRange(ts: TimeSeries, range: DateRange): TimeSeries {
  const { timestamps, values, resolution } = ts
  if (timestamps.length === 0) return { timestamps: [], values: [], resolution }

  // Find start and end indices using the regular spacing
  const intervalMs = resolution === 'half-hourly' ? HALF_HOUR_MS : HOUR_MS
  const startIdx = Math.max(0, Math.ceil((range.start - timestamps[0]) / intervalMs))
  const endIdx = Math.min(timestamps.length - 1, Math.floor((range.end - timestamps[0]) / intervalMs))

  if (startIdx > endIdx) return { timestamps: [], values: [], resolution }

  return {
    timestamps: timestamps.slice(startIdx, endIdx + 1),
    values: values.slice(startIdx, endIdx + 1),
    resolution,
  }
}

/**
 * Aggregate a half-hourly timeseries to hourly by summing consecutive pairs.
 * If already hourly, returns as-is.
 */
export function toHourly(ts: TimeSeries): TimeSeries {
  if (ts.resolution === 'hourly') return ts

  const hourlyTimestamps: number[] = []
  const hourlyValues: number[] = []

  for (let i = 0; i < ts.values.length; i += 2) {
    hourlyTimestamps.push(ts.timestamps[i])
    // If odd number of values, last one stands alone
    const v1 = ts.values[i]
    const v2 = i + 1 < ts.values.length ? ts.values[i + 1] : 0
    hourlyValues.push(v1 + v2)
  }

  return {
    timestamps: hourlyTimestamps,
    values: hourlyValues,
    resolution: 'hourly',
  }
}

/**
 * Get the interval duration in milliseconds for a resolution.
 */
export function intervalMs(resolution: Resolution): number {
  return resolution === 'half-hourly' ? HALF_HOUR_MS : HOUR_MS
}
