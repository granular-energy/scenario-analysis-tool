import Papa from 'papaparse'
import type { Profile } from '../types'

const EXPECTED_ROWS = 8760

export interface CsvImportResult {
  profile: Profile
  warnings: string[]
}

export interface CsvImportError {
  error: string
}

export function parseCsvToProfile(
  csvText: string,
  name: string,
  category: 'consumption' | 'generation'
): CsvImportResult | CsvImportError {
  const warnings: string[] = []

  const parsed = Papa.parse(csvText.trim(), {
    dynamicTyping: true,
    skipEmptyLines: true,
  })

  if (parsed.errors.length > 0) {
    return { error: `CSV parse error: ${parsed.errors[0].message} (row ${parsed.errors[0].row})` }
  }

  const rows = parsed.data as unknown[][]
  if (rows.length === 0) {
    return { error: 'CSV file is empty.' }
  }

  // Detect format: single column of values, or two columns (timestamp + value)
  const firstRow = rows[0]
  const numCols = Array.isArray(firstRow) ? firstRow.length : 1

  let values: number[]

  if (numCols === 1) {
    // Single column: may have a header
    values = extractSingleColumn(rows, warnings)
  } else {
    // Multi-column: find the numeric value column
    values = extractMultiColumn(rows, warnings)
  }

  // Validate row count
  if (values.length === EXPECTED_ROWS + 24) {
    // Leap year (8784) — trim last 24 hours
    warnings.push('File has 8784 rows (leap year). Last 24 hours trimmed to fit 8760.')
    values = values.slice(0, EXPECTED_ROWS)
  } else if (values.length !== EXPECTED_ROWS) {
    return { error: `Expected ${EXPECTED_ROWS} hourly values, got ${values.length}.` }
  }

  // Check for negative values
  const negCount = values.filter((v) => v < 0).length
  if (negCount > 0) {
    return { error: `Found ${negCount} negative values. All values must be >= 0.` }
  }

  // Check for all zeros
  const sum = values.reduce((a, b) => a + b, 0)
  if (sum === 0) {
    return { error: 'All values are zero. The profile must contain some non-zero values.' }
  }

  // Normalise to sum to 1.0
  const normalised = values.map((v) => v / sum)

  const id = `custom-${category}-${Date.now()}`
  const profile: Profile = {
    id,
    name,
    category,
    region: 'Custom',
    technology: name,
    description: `Custom ${category} profile uploaded by user`,
    data: normalised,
  }

  return { profile, warnings }
}

function extractSingleColumn(rows: unknown[][], warnings: string[]): number[] {
  const values: number[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const val = Array.isArray(row) ? row[0] : row

    if (typeof val === 'number' && !isNaN(val)) {
      values.push(val)
    } else if (typeof val === 'string') {
      const parsed = parseFloat(val)
      if (!isNaN(parsed)) {
        values.push(parsed)
      } else if (i === 0) {
        warnings.push('Header row detected and skipped.')
      }
    }
  }

  return values
}

function extractMultiColumn(rows: unknown[][], warnings: string[]): number[] {
  const values: number[] = []

  // Find the first numeric column (skip timestamp columns)
  let valueColIndex = -1
  const firstDataRow = rows.length > 1 ? rows[1] : rows[0]

  if (Array.isArray(firstDataRow)) {
    for (let c = 0; c < firstDataRow.length; c++) {
      const val = firstDataRow[c]
      if (typeof val === 'number' && !isNaN(val)) {
        valueColIndex = c
        break
      }
    }
  }

  if (valueColIndex === -1) {
    // Try second column as string-parseable number
    if (Array.isArray(firstDataRow) && firstDataRow.length >= 2) {
      const parsed = parseFloat(String(firstDataRow[1]))
      if (!isNaN(parsed)) {
        valueColIndex = 1
      }
    }
  }

  if (valueColIndex === -1) {
    return [] // Will trigger row count error
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!Array.isArray(row)) continue
    const val = row[valueColIndex]

    if (typeof val === 'number' && !isNaN(val)) {
      values.push(val)
    } else if (typeof val === 'string') {
      const parsed = parseFloat(val)
      if (!isNaN(parsed)) {
        values.push(parsed)
      } else if (i === 0) {
        warnings.push('Header row detected and skipped.')
      }
    }
  }

  return values
}
