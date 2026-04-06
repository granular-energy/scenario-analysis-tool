import type { PortfolioProfile, AllocationMatrix, DateRange, SankeyLink } from '../types'
import { filterToRange, toHourly } from './timeseries'

/**
 * Compute Sankey diagram links from the allocation matrix and profile timeseries.
 *
 * Each link represents the total MWh allocated from one generator to one consumer
 * within the given date range:
 *   weight = totalGenMWh × allocationPercentage / 100
 */
export function computeSankeyLinks(
  generators: PortfolioProfile[],
  consumers: PortfolioProfile[],
  allocationMatrix: AllocationMatrix,
  dateRange: DateRange
): SankeyLink[] {
  const links: SankeyLink[] = []

  for (const gen of generators) {
    const genHourly = toHourly(filterToRange(gen.timeSeries, dateRange))
    const totalGenMWh = genHourly.values.reduce((a, b) => a + b, 0)
    if (totalGenMWh <= 0) continue

    const genAllocations = allocationMatrix[gen.id]
    if (!genAllocations) continue

    for (const consumer of consumers) {
      const pct = genAllocations[consumer.id] ?? 0
      if (pct <= 0) continue

      const weight = totalGenMWh * (pct / 100)
      if (weight > 0) {
        links.push({
          from: gen.name,
          to: consumer.name,
          weight: Math.round(weight * 100) / 100, // round to 2 decimals
        })
      }
    }
  }

  return links
}
