/** localStorage persistence for the portfolio state, with schema migration. */

import type { PortfolioState } from './portfolioTypes'

const STORAGE_KEY = 'sat-v3-portfolio'

export function savePortfolio(state: PortfolioState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Silently ignore quota errors; the user can still use the tool
  }
}

/** Shape of a generator in the pre-M3b schema (capacityMW-based). */
interface LegacyGenerator {
  capacityMW: number
  capacityFactor: number
  annualMWh?: undefined
}

/**
 * Migrate a persisted portfolio from the old capacityMW-based generator schema
 * to the new annualMWh-based schema. Returns the state unchanged if already migrated.
 */
export function migratePortfolioState(raw: Record<string, unknown>): PortfolioState {
  const state = raw as unknown as PortfolioState
  // Check whether any generator still has the old capacityMW field
  const generators = (raw['generators'] as Record<string, unknown>[]) ?? []
  const needsMigration = generators.some((g) => 'capacityMW' in g && !('annualMWh' in g))
  if (!needsMigration) return state

  const migratedGenerators = generators.map((g) => {
    const legacy = g as unknown as LegacyGenerator
    if ('capacityMW' in g && !('annualMWh' in g)) {
      const annualMWh = Math.round(legacy.capacityMW * legacy.capacityFactor * 8760)
      const { capacityMW: _, ...rest } = g as Record<string, unknown>
      return { ...rest, annualMWh }
    }
    return g
  })

  return { ...state, generators: migratedGenerators } as unknown as PortfolioState
}

export function loadPortfolio(): PortfolioState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return migratePortfolioState(parsed)
  } catch {
    return null
  }
}

export function clearPortfolio(): void {
  localStorage.removeItem(STORAGE_KEY)
}
