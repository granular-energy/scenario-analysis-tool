/** Scenario import/export — self-contained JSON files and localStorage persistence for saved scenarios. */

import type { MatchingGranularity, EngineResult } from '../engine/types'
import { HOURS_PER_YEAR } from '../engine/types'
import type {
  PortfolioConsumer,
  PortfolioGenerator,
  PortfolioMatrix,
  PortfolioState,
} from '../state/portfolioTypes'

/** Snapshot of key results, stored with the scenario so Compare can render without re-running the engine. */
export interface ScenarioResultsSummary {
  readonly hourlyScore: number
  readonly annualScore: number
  readonly totalExcessMWh: number
  readonly totalUnmatchedMWh: number
  /** 12 monthly hourly-matching scores. */
  readonly monthlyScores: readonly number[]
}

/** A saved scenario, persisted in localStorage. */
export interface SavedScenario {
  readonly id: string
  readonly name: string
  readonly savedAt: string // ISO timestamp
  readonly portfolio: PortfolioState
  readonly results: ScenarioResultsSummary
}

/** The JSON file format for scenario export/import. Self-contained with embedded shapes. */
export interface ScenarioFile {
  readonly version: 1
  readonly name: string
  readonly exportedAt: string
  readonly consumers: readonly PortfolioConsumer[]
  readonly generators: readonly PortfolioGenerator[]
  readonly matrix: PortfolioMatrix
  readonly granularity: MatchingGranularity
}

const VALID_GRANULARITIES: readonly string[] = ['hourly', 'monthly', 'annual', 'as-produced']

/** Returns a short random identifier suitable for scenario IDs. */
export function generateId(): string {
  return crypto.randomUUID()
}

/** Extracts the four tile values and monthly scores from the portfolio summary. */
export function createScenarioResultsSummary(engineResult: EngineResult): ScenarioResultsSummary {
  const p = engineResult.portfolio
  return {
    hourlyScore: p.hourlyScore,
    annualScore: p.annualScore,
    totalExcessMWh: p.totalExcessMWh,
    totalUnmatchedMWh: p.totalUnmatchedMWh,
    monthlyScores: [...p.monthlyScores],
  }
}

/** Builds the JSON export object from a portfolio name and state. */
export function exportScenarioFile(name: string, state: PortfolioState): ScenarioFile {
  return {
    version: 1,
    name,
    exportedAt: new Date().toISOString(),
    consumers: state.consumers,
    generators: state.generators,
    matrix: state.matrix,
    granularity: state.granularity,
  }
}

/**
 * Validates an imported JSON object as a ScenarioFile.
 * Returns a descriptive error message naming the specific problem.
 */
export function validateScenarioFile(
  data: unknown,
): { ok: true; file: ScenarioFile } | { ok: false; error: string } {
  if (data === null || typeof data !== 'object') {
    return { ok: false, error: 'File is not a valid JSON object' }
  }

  const obj = data as Record<string, unknown>

  // Version check
  if (obj['version'] !== 1) {
    return { ok: false, error: 'Unsupported file version (expected version 1)' }
  }

  // Name
  if (typeof obj['name'] !== 'string' || obj['name'].length === 0) {
    return { ok: false, error: 'Missing or empty scenario name' }
  }

  // Granularity
  if (typeof obj['granularity'] !== 'string' || !VALID_GRANULARITIES.includes(obj['granularity'])) {
    return {
      ok: false,
      error: `Invalid granularity (expected one of ${VALID_GRANULARITIES.join(', ')})`,
    }
  }

  // Consumers
  if (!Array.isArray(obj['consumers']) || obj['consumers'].length === 0) {
    return { ok: false, error: 'Consumers array is missing or empty' }
  }

  for (let i = 0; i < obj['consumers'].length; i++) {
    const c = obj['consumers'][i] as Record<string, unknown>
    if (typeof c !== 'object' || c === null) {
      return { ok: false, error: `Consumer at index ${i} is not a valid object` }
    }
    if (typeof c['uid'] !== 'string' || c['uid'].length === 0) {
      return { ok: false, error: `Consumer at index ${i} is missing a uid` }
    }
    if (typeof c['name'] !== 'string' || c['name'].length === 0) {
      return { ok: false, error: `Consumer at index ${i} is missing a name` }
    }
    if (typeof c['annualMWh'] !== 'number' || !isFinite(c['annualMWh'])) {
      return { ok: false, error: `Consumer "${c['name'] ?? i}" has an invalid annualMWh` }
    }
    if (!Array.isArray(c['shape']) || c['shape'].length !== HOURS_PER_YEAR) {
      return {
        ok: false,
        error: `Consumer "${c['name'] ?? i}" has a shape of length ${Array.isArray(c['shape']) ? c['shape'].length : 'undefined'} (expected ${HOURS_PER_YEAR})`,
      }
    }
  }

  // Generators
  if (!Array.isArray(obj['generators']) || obj['generators'].length === 0) {
    return { ok: false, error: 'Generators array is missing or empty' }
  }

  for (let i = 0; i < obj['generators'].length; i++) {
    const g = obj['generators'][i] as Record<string, unknown>
    if (typeof g !== 'object' || g === null) {
      return { ok: false, error: `Generator at index ${i} is not a valid object` }
    }
    if (typeof g['uid'] !== 'string' || g['uid'].length === 0) {
      return { ok: false, error: `Generator at index ${i} is missing a uid` }
    }
    if (typeof g['name'] !== 'string' || g['name'].length === 0) {
      return { ok: false, error: `Generator at index ${i} is missing a name` }
    }
    if (typeof g['annualMWh'] !== 'number' || !isFinite(g['annualMWh'])) {
      return { ok: false, error: `Generator "${g['name'] ?? i}" has an invalid annualMWh` }
    }
    if (!Array.isArray(g['shape']) || g['shape'].length !== HOURS_PER_YEAR) {
      return {
        ok: false,
        error: `Generator "${g['name'] ?? i}" has a shape of length ${Array.isArray(g['shape']) ? g['shape'].length : 'undefined'} (expected ${HOURS_PER_YEAR})`,
      }
    }
    if (typeof g['technology'] !== 'string' || g['technology'].length === 0) {
      return { ok: false, error: `Generator "${g['name'] ?? i}" is missing a technology` }
    }
    if (typeof g['capacityFactor'] !== 'number' || !isFinite(g['capacityFactor'])) {
      return {
        ok: false,
        error: `Generator "${g['name'] ?? i}" has an invalid capacityFactor`,
      }
    }
  }

  // Matrix
  if (typeof obj['matrix'] !== 'object' || obj['matrix'] === null || Array.isArray(obj['matrix'])) {
    return { ok: false, error: 'Matrix is missing or not an object' }
  }

  return { ok: true, file: data as ScenarioFile }
}

/** Converts a valid ScenarioFile back to a PortfolioState. */
export function scenarioFileToPortfolioState(file: ScenarioFile): PortfolioState {
  return {
    consumers: file.consumers,
    generators: file.generators,
    matrix: file.matrix,
    granularity: file.granularity,
  }
}
