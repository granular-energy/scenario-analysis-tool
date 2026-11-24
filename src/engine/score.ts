import { allocateToConsumer, type SupplyForConsumer } from './allocate'
import { sum, sumByMonth } from './typicalYear'
import {
  HOURS_PER_YEAR,
  type ConsumerResult,
  type EngineInput,
  type EngineResult,
  type GeneratorContribution,
  type GeneratorUtilisation,
  type HourlySeries,
  type MatchingSummary,
} from './types'

function pct(numerator: number, denominator: number): number {
  return denominator > 0 ? (numerator / denominator) * 100 : 0
}

function summarise(
  demandMWh: HourlySeries,
  allocatedMWh: HourlySeries,
  suppliedMWh: number,
): MatchingSummary {
  const matched = new Array<number>(HOURS_PER_YEAR)
  const excess = new Array<number>(HOURS_PER_YEAR)
  const unmatched = new Array<number>(HOURS_PER_YEAR)
  const matchPct = new Array<number>(HOURS_PER_YEAR)
  for (let h = 0; h < HOURS_PER_YEAR; h++) {
    const d = demandMWh[h]
    const a = allocatedMWh[h]
    const m = Math.min(a, d)
    matched[h] = m
    excess[h] = a - m
    unmatched[h] = d - m
    matchPct[h] = pct(m, d)
  }
  const monthlyDemand = sumByMonth(demandMWh)
  const monthlyMatched = sumByMonth(matched)
  const totalDemand = sum(demandMWh)
  const totalAllocated = sum(allocatedMWh)
  const totalMatched = sum(matched)
  return {
    hourlyScore: pct(totalMatched, totalDemand),
    // Annual score compares volumes only, so equal annual generation and consumption always reads 100 %
    annualScore: pct(suppliedMWh, totalDemand),
    totalDemandMWh: totalDemand,
    totalSuppliedMWh: suppliedMWh,
    totalAllocatedMWh: totalAllocated,
    totalMatchedMWh: totalMatched,
    totalExcessMWh: totalAllocated - totalMatched,
    totalUnmatchedMWh: totalDemand - totalMatched,
    monthlyScores: monthlyMatched.map((m, i) => pct(m, monthlyDemand[i])),
    monthlyDemandMWh: monthlyDemand,
    monthlyMatchedMWh: monthlyMatched,
    monthlyExcessMWh: sumByMonth(excess),
    monthlyUnmatchedMWh: sumByMonth(unmatched),
    demandMWh,
    allocatedMWh,
    matchedMWh: matched,
    excessMWh: excess,
    unmatchedMWh: unmatched,
    hourlyMatchPct: matchPct,
  }
}

function addInto(target: number[], source: HourlySeries): void {
  for (let h = 0; h < HOURS_PER_YEAR; h++) target[h] += source[h]
}

/**
 * Build the per-consumer supply series for consumption-share mode.
 * Each pair's supply = generator normalised shape × (pct / 100 × consumer total demand MWh).
 * The generator's own library size is ignored; only its shape matters.
 */
function buildConsumptionShareSupplies(
  consumer: { id: string; demandMWh: HourlySeries },
  generators: readonly { id: string; generationMWh: HourlySeries }[],
  consumptionMatrix: { readonly [gId: string]: { readonly [cId: string]: number } },
): SupplyForConsumer[] {
  const consumerDemandTotal = sum(consumer.demandMWh)
  return generators.flatMap((g) => {
    const pct = consumptionMatrix[g.id]?.[consumer.id] ?? 0
    if (pct <= 0) return []
    const targetMWh = (pct / 100) * consumerDemandTotal
    // Normalise the generator shape to sum to 1, then scale to targetMWh
    const shapeTotal = sum(g.generationMWh)
    if (shapeTotal <= 0) return []
    const supplyMWh = g.generationMWh.map((v) => (v / shapeTotal) * targetMWh)
    return [{ generatorId: g.id, supplyMWh }]
  })
}

export function runEngine(input: EngineInput): EngineResult {
  const { consumers, generators, matrix, granularity } = input
  const mode = input.allocationMode ?? 'generator-share'
  const consumptionMatrix = input.consumptionMatrix ?? {}
  const isConsumptionShare = mode === 'consumption-share'

  const allocatedByGenerator = new Map<string, Record<string, number>>(generators.map((g) => [g.id, {}]))
  const portfolioDemand = new Array<number>(HOURS_PER_YEAR).fill(0)
  const portfolioAllocated = new Array<number>(HOURS_PER_YEAR).fill(0)
  let portfolioSupplied = 0

  const consumerResults: ConsumerResult[] = consumers.map((consumer) => {
    const supplies: SupplyForConsumer[] = isConsumptionShare
      ? buildConsumptionShareSupplies(consumer, generators, consumptionMatrix)
      : generators.flatMap((g) => {
          const share = (matrix[g.id]?.[consumer.id] ?? 0) / 100
          if (share <= 0) return []
          return [{ generatorId: g.id, supplyMWh: g.generationMWh.map((v) => v * share) }]
        })
    const allocations = allocateToConsumer(consumer.demandMWh, supplies, granularity)

    const allocated = new Array<number>(HOURS_PER_YEAR).fill(0)
    allocations.forEach((a) => addInto(allocated, a))
    const supplied = supplies.reduce((total, s) => total + sum(s.supplyMWh), 0)
    portfolioSupplied += supplied
    const summary = summarise(consumer.demandMWh, allocated, supplied)

    const contributions: GeneratorContribution[] = supplies.map((s, i) => {
      const a = allocations[i]
      // A generator's matched energy is its pro-rata share of the hour's matched volume
      const matched = a.map((v, h) => (allocated[h] > 0 ? (summary.matchedMWh[h] * v) / allocated[h] : 0))
      const total = sum(a)
      allocatedByGenerator.get(s.generatorId)![consumer.id] = total
      return {
        generatorId: s.generatorId,
        allocatedMWh: a,
        matchedMWh: matched,
        monthlyAllocatedMWh: sumByMonth(a),
        monthlyMatchedMWh: sumByMonth(matched),
        totalAllocatedMWh: total,
        totalMatchedMWh: sum(matched),
      }
    })

    addInto(portfolioDemand, consumer.demandMWh)
    addInto(portfolioAllocated, allocated)
    return { consumerId: consumer.id, ...summary, generators: contributions }
  })

  const utilisation: GeneratorUtilisation[] = generators.map((g) => {
    const byConsumer = allocatedByGenerator.get(g.id)!
    const allocatedTotal = Object.values(byConsumer).reduce((a, b) => a + b, 0)

    if (isConsumptionShare) {
      // In consumption-share mode the generator's library size is irrelevant.
      // Report assigned total as generation, with zero surplus.
      return {
        generatorId: g.id,
        totalGenerationMWh: allocatedTotal,
        allocatedMWh: allocatedTotal,
        unallocatedMWh: 0,
        allocatedByConsumer: byConsumer,
      }
    }

    const generationTotal = sum(g.generationMWh)
    return {
      generatorId: g.id,
      totalGenerationMWh: generationTotal,
      allocatedMWh: allocatedTotal,
      unallocatedMWh: generationTotal - allocatedTotal,
      allocatedByConsumer: byConsumer,
    }
  })

  return {
    granularity,
    portfolio: summarise(portfolioDemand, portfolioAllocated, portfolioSupplied),
    consumers: consumerResults,
    generators: utilisation,
  }
}
