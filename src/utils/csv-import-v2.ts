import Papa from 'papaparse'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import utc from 'dayjs/plugin/utc'
import type { PortfolioProfile, TimeSeries } from '../types'
import { detectResolution } from './timeseries'

dayjs.extend(customParseFormat)
dayjs.extend(utc)

export interface CsvImportResult {
  profile: PortfolioProfile
  warnings: string[]
}

export interface CsvImportError {
  error: string
}

/** Common timestamp formats to try */
const TIMESTAMP_FORMATS = [
  'YYYY-MM-DDTHH:mm:ssZ',
  'YYYY-MM-DDTHH:mm:ss',
  'YYYY-MM-DD HH:mm:ss',
  'YYYY-MM-DD HH:mm',
  'DD/MM/YYYY HH:mm:ss',
  'DD/MM/YYYY HH:mm',
  'MM/DD/YYYY HH:mm:ss',
  'MM/DD/YYYY HH:mm',
]

function parseTimestamp(value: string): number | null {
  // Try ISO 8601 first (dayjs handles this natively)
  const iso = dayjs.utc(value)
  if (iso.isValid()) return iso.valueOf()

  // Try explicit formats
  for (const fmt of TIMESTAMP_FORMATS) {
    const parsed = dayjs.utc(value, fmt, true)
    if (parsed.isValid()) return parsed.valueOf()
  }

  return null
}

/**
 * Parse a two-column CSV (timestamp, value) into a PortfolioProfile.
 * Values are raw MWh — no normalisation.
 * Resolution is auto-detected from timestamp intervals.
 */
export function parseCsvToProfile(
  csvText: string,
  name: string,
  role: 'consumer' | 'generator'
): CsvImportResult | CsvImportError {
  const warnings: string[] = []

  const parsed = Papa.parse(csvText.trim(), {
    skipEmptyLines: true,
  })

  if (parsed.errors.length > 0) {
    const firstError = parsed.errors[0]
    return { error: `CSV parse error (row ${firstError.row}): ${firstError.message}` }
  }

  const rows = parsed.data as string[][]
  if (rows.length < 2) {
    return { error: 'CSV must contain at least 2 data rows.' }
  }

  // Detect if first row is a header
  let startRow = 0
  if (rows[0].length >= 2) {
    const firstTimestamp = parseTimestamp(rows[0][0])
    if (firstTimestamp === null) {
      // First row is likely a header
      startRow = 1
    }
  }

  // Extract two columns: timestamp + value
  const timestamps: number[] = []
  const values: number[] = []
  let hasNegative = false

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 2) {
      return { error: `Row ${i + 1} has fewer than 2 columns. Expected: timestamp, value.` }
    }

    const ts = parseTimestamp(row[0].trim())
    if (ts === null) {
      return { error: `Row ${i + 1}: unable to parse timestamp "${row[0].trim()}".` }
    }

    const val = parseFloat(row[1].trim())
    if (isNaN(val)) {
      return { error: `Row ${i + 1}: unable to parse value "${row[1].trim()}".` }
    }

    if (val < 0) hasNegative = true

    timestamps.push(ts)
    values.push(val)
  }

  if (hasNegative) {
    warnings.push('Some values are negative. This may indicate data quality issues.')
  }

  if (values.length < 24) {
    return { error: `Only ${values.length} data points found. Expected at least 24 (one day of hourly data).` }
  }

  // Validate monotonically increasing timestamps
  for (let i = 1; i < timestamps.length; i++) {
    if (timestamps[i] <= timestamps[i - 1]) {
      return { error: `Timestamps are not monotonically increasing at row ${startRow + i + 1}.` }
    }
  }

  // Detect resolution
  let resolution: TimeSeries['resolution']
  try {
    resolution = detectResolution(timestamps)
  } catch (e) {
    return { error: (e as Error).message }
  }

  const totalMWh = values.reduce((a, b) => a + b, 0)
  if (totalMWh === 0) {
    return { error: 'All values sum to zero. The profile must contain non-zero energy data.' }
  }

  const dataPoints = values.length
  const expectedLabel = resolution === 'half-hourly' ? '17,520 (one year half-hourly)' : '8,760 (one year hourly)'
  if (resolution === 'hourly' && dataPoints !== 8760 && dataPoints !== 8784) {
    warnings.push(`${dataPoints} data points (expected ${expectedLabel} for a full year). Partial year data is supported.`)
  }
  if (resolution === 'half-hourly' && dataPoints !== 17520 && dataPoints !== 17568) {
    warnings.push(`${dataPoints} data points (expected ${expectedLabel} for a full year). Partial year data is supported.`)
  }

  const profile: PortfolioProfile = {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    role,
    timeSeries: {
      timestamps,
      values,
      resolution,
    },
  }

  return { profile, warnings }
}
