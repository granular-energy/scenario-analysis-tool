import { HOURS_PER_YEAR, type HourlySeries, type MatchingGranularity } from './types'
import { hourWindows, monthWindows, YEAR_WINDOW, type Window } from './typicalYear'

/** Below this many MWh the platform treats supply or an allocation as nothing; mirrored for parity. */
const NEGLIGIBLE_MWH = 0.001

export function windowsFor(granularity: Exclude<MatchingGranularity, 'as-produced'>): Window[] {
  switch (granularity) {
    case 'hourly':
      return hourWindows()
    case 'monthly':
      return monthWindows()
    case 'annual':
      return [YEAR_WINDOW]
  }
}

export interface SupplyForConsumer {
  readonly generatorId: string
  /** This consumer's share of the generator's output, already scaled by the matrix percentage. */
  readonly supplyMWh: HourlySeries
}

/**
 * As-consumed allocation for one consumer. Within each matching window the largest supplier goes first,
 * each allocating min(its supply, remaining demand) spread across the window in its own hourly shape.
 * Returns one hourly allocation series per supplier, in the order given.
 *
 * For 'as-produced', each generator's full supply share is assigned with no cap at demand in any window.
 */
export function allocateToConsumer(
  demandMWh: HourlySeries,
  supplies: readonly SupplyForConsumer[],
  granularity: MatchingGranularity,
): number[][] {
  const allocations = supplies.map(() => new Array<number>(HOURS_PER_YEAR).fill(0))

  // As-produced: assign each generator's full supply share, no capping at demand
  if (granularity === 'as-produced') {
    for (let i = 0; i < supplies.length; i++) {
      const s = supplies[i].supplyMWh
      const out = allocations[i]
      for (let h = 0; h < HOURS_PER_YEAR; h++) out[h] = s[h]
    }
    return allocations
  }

  const windowSupply = new Array<number>(supplies.length)
  const order = supplies.map((_, i) => i)
  // The platform preserves shape at half-hourly resolution, so with hourly matching each hour is served in
  // two half-hour passes: every generator offers half its hour in each pass, largest first. The hour's total
  // is unchanged but the split between generators interleaves, and the golden fixtures reflect that.
  const passes = granularity === 'hourly' ? 2 : 1

  for (const { start, end } of windowsFor(granularity)) {
    let remaining = 0
    for (let h = start; h < end; h++) remaining += demandMWh[h]

    for (let i = 0; i < supplies.length; i++) {
      let total = 0
      const s = supplies[i].supplyMWh
      for (let h = start; h < end; h++) total += s[h]
      windowSupply[i] = total / passes
    }
    // Stable sort keeps input order for equal volumes, matching the platform's sorted(..., key=-volume)
    order.sort((a, b) => windowSupply[b] - windowSupply[a])

    for (let pass = 0; pass < passes; pass++) {
      for (const i of order) {
        const available = windowSupply[i]
        if (available <= NEGLIGIBLE_MWH) continue
        const quantity = Math.min(available, remaining)
        if (quantity <= NEGLIGIBLE_MWH) continue
        const scale = quantity / (available * passes)
        const s = supplies[i].supplyMWh
        const out = allocations[i]
        for (let h = start; h < end; h++) out[h] += s[h] * scale
        remaining -= quantity
      }
    }
  }
  return allocations
}
