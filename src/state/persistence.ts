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
  const needsCapMigration = generators.some((g) => 'capacityMW' in g && !('annualMWh' in g))

  let result = state

  if (needsCapMigration) {
    const migratedGenerators = generators.map((g) => {
      const legacy = g as unknown as LegacyGenerator
      if ('capacityMW' in g && !('annualMWh' in g)) {
        const annualMWh = Math.round(legacy.capacityMW * legacy.capacityFactor * 8760)
        const { capacityMW: _, ...rest } = g as Record<string, unknown>
        return { ...rest, annualMWh }
      }
      return g
    })
    result = { ...result, generators: migratedGenerators } as unknown as PortfolioState
  }

  // M7: add allocationMode and consumptionMatrix if missing
  if (!('allocationMode' in raw) || !('consumptionMatrix' in raw)) {
    const emptyConsumptionMatrix: Record<string, Record<string, number>> = {}
    const gens = (result.generators ?? []) as unknown as Array<{ uid: string }>
    const cons = (result.consumers ?? []) as unknown as Array<{ uid: string }>
    for (const g of gens) {
      const row: Record<string, number> = {}
      for (const c of cons) row[c.uid] = 0
      emptyConsumptionMatrix[g.uid] = row
    }
    result = {
      ...result,
      allocationMode: (raw['allocationMode'] as 'generator-share' | 'consumption-share') ?? 'generator-share',
      consumptionMatrix:
        (raw['consumptionMatrix'] as Record<string, Record<string, number>>) ?? emptyConsumptionMatrix,
    } as PortfolioState
  }

  return result
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
