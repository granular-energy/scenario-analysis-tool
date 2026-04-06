import type {
  PortfolioProfile,
  AllocationMatrix,
  DateRange,
  ConsumerResult,
  GeneratorContribution,
} from '../types'
import { filterToRange, toHourly } from './timeseries'

/**
 * Month boundaries for a year. Used to aggregate hourly data into monthly scores.
 * Each entry is { month: 0-11, startDay: cumulative day offset, hours: hours in month }.
 */
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

/**
 * Given an array of timestamps (epoch ms), group indices by calendar month.
 * Returns an array of { month, indices } objects.
 */
function groupByMonth(timestamps: number[]): { month: number; indices: number[] }[] {
  const groups = new Map<string, { month: number; indices: number[] }>()

  for (let i = 0; i < timestamps.length; i++) {
    const d = new Date(timestamps[i])
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`
    const existing = groups.get(key)
    if (existing) {
      existing.indices.push(i)
    } else {
      groups.set(key, { month: d.getUTCMonth(), indices: [i] })
    }
  }

  return Array.from(groups.values())
}

/**
 * Calculate matching results for a single consumer given generators and allocation matrix.
 *
 * For each interval h in the date range:
 *   allocatedGen[h] = SUM over generators G: G.values[h] × matrix[G.id][C.id] / 100
 *   matched[h] = min(allocatedGen[h], C.values[h])
 *
 * All values are raw MWh. No normalisation.
 */
export function calculateConsumerMatching(
  consumer: PortfolioProfile,
  generators: PortfolioProfile[],
  allocationMatrix: AllocationMatrix,
  dateRange: DateRange
): ConsumerResult {
  // Filter and align to hourly resolution
  const consumerHourly = toHourly(filterToRange(consumer.timeSeries, dateRange))
  const n = consumerHourly.values.length

  if (n === 0) {
    return emptyResult(consumer.id)
  }

  // Prepare aligned generator timeseries
  const alignedGens: { id: string; name: string; values: number[]; allocation: number }[] = []
  for (const gen of generators) {
    const alloc = allocationMatrix[gen.id]?.[consumer.id] ?? 0
    if (alloc <= 0) continue

    const genHourly = toHourly(filterToRange(gen.timeSeries, dateRange))
    // Ensure same length — trim to the shorter of the two
    const len = Math.min(n, genHourly.values.length)
    alignedGens.push({
      id: gen.id,
      name: gen.name,
      values: genHourly.values.slice(0, len),
      allocation: alloc,
    })
  }

  // Calculate hourly allocated generation and matching
  const hourlyAllocatedGen = new Array<number>(n).fill(0)
  const hourlyMatched = new Array<number>(n)
  const hourlyMatchingPct = new Array<number>(n)

  // Per-generator allocated arrays (for contribution calculation)
  const genAllocated: number[][] = alignedGens.map(() => new Array<number>(n).fill(0))

  for (let g = 0; g < alignedGens.length; g++) {
    const { values, allocation } = alignedGens[g]
    for (let h = 0; h < Math.min(n, values.length); h++) {
      const allocated = values[h] * (allocation / 100)
      genAllocated[g][h] = allocated
      hourlyAllocatedGen[h] += allocated
    }
  }

  for (let h = 0; h < n; h++) {
    hourlyMatched[h] = Math.min(hourlyAllocatedGen[h], consumerHourly.values[h])
    hourlyMatchingPct[h] = consumerHourly.values[h] > 0
      ? (hourlyMatched[h] / consumerHourly.values[h]) * 100
      : 0
  }

  // Totals
  const totalConsumption = consumerHourly.values.reduce((a, b) => a + b, 0)
  const totalMatched = hourlyMatched.reduce((a, b) => a + b, 0)
  const totalAllocatedGen = hourlyAllocatedGen.reduce((a, b) => a + b, 0)

  const cfeScore = totalConsumption > 0 ? (totalMatched / totalConsumption) * 100 : 0
  const annualScore = totalConsumption > 0 ? (totalAllocatedGen / totalConsumption) * 100 : 0

  // Monthly scores
  const monthGroups = groupByMonth(consumerHourly.timestamps)
  const monthlyScores = new Array<number>(12).fill(0)
  for (const { month, indices } of monthGroups) {
    let monthConsumption = 0
    let monthMatched = 0
    for (const i of indices) {
      monthConsumption += consumerHourly.values[i]
      monthMatched += hourlyMatched[i]
    }
    monthlyScores[month] = monthConsumption > 0 ? (monthMatched / monthConsumption) * 100 : 0
  }

  // Generator contributions
  const generatorContributions: GeneratorContribution[] = alignedGens.map((gen, g) => {
    const monthlyMatchedMWh = new Array<number>(12).fill(0)
    let totalGenAllocated = 0

    for (const { month, indices } of monthGroups) {
      for (const i of indices) {
        const totalGen = hourlyAllocatedGen[i]
        if (totalGen > 0) {
          const share = genAllocated[g][i] / totalGen
          monthlyMatchedMWh[month] += hourlyMatched[i] * share
        }
        totalGenAllocated += genAllocated[g][i]
      }
    }

    return {
      generatorId: gen.id,
      generatorName: gen.name,
      monthlyMatchedMWh,
      totalAllocatedMWh: totalGenAllocated,
    }
  })

  return {
    consumerId: consumer.id,
    cfeScore,
    annualScore,
    hourlyMatchedMWh: hourlyMatched,
    hourlyConsumptionMWh: consumerHourly.values,
    hourlyMatchingPercentage: hourlyMatchingPct,
    monthlyScores,
    generatorContributions,
  }
}

function emptyResult(consumerId: string): ConsumerResult {
  return {
    consumerId,
    cfeScore: 0,
    annualScore: 0,
    hourlyMatchedMWh: [],
    hourlyConsumptionMWh: [],
    hourlyMatchingPercentage: [],
    monthlyScores: new Array(12).fill(0),
    generatorContributions: [],
  }
}

// Re-export MONTH_DAYS for use in charts
export { MONTH_DAYS }
