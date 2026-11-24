export const HOURS_PER_YEAR = 8760

/** MWh per hour over the typical year; always exactly HOURS_PER_YEAR long. */
export type HourlySeries = readonly number[]

export type MatchingGranularity = 'hourly' | 'monthly' | 'annual' | 'as-produced'

export type AllocationMode = 'generator-share' | 'consumption-share'

export interface Consumer {
  readonly id: string
  readonly demandMWh: HourlySeries
}

export interface Generator {
  readonly id: string
  readonly generationMWh: HourlySeries
}

/** generatorId → consumerId → percent (0–100) of that generator's output allocated to that consumer. */
export type AllocationMatrix = Readonly<Record<string, Readonly<Record<string, number>>>>

export interface EngineInput {
  readonly consumers: readonly Consumer[]
  readonly generators: readonly Generator[]
  readonly matrix: AllocationMatrix
  readonly granularity: MatchingGranularity
  /** Defaults to 'generator-share'. In 'consumption-share' mode, the consumptionMatrix is used instead. */
  readonly allocationMode?: AllocationMode
  /** generatorId → consumerId → percent of consumer's annual demand supplied in the generator's shape. */
  readonly consumptionMatrix?: AllocationMatrix
}

export interface GeneratorContribution {
  readonly generatorId: string
  readonly allocatedMWh: HourlySeries
  readonly matchedMWh: HourlySeries
  readonly monthlyAllocatedMWh: readonly number[]
  readonly monthlyMatchedMWh: readonly number[]
  readonly totalAllocatedMWh: number
  readonly totalMatchedMWh: number
}

export interface MatchingSummary {
  readonly hourlyScore: number
  /** Volumetric coverage: generation assigned via the matrix ÷ demand, independent of the matching method. */
  readonly annualScore: number
  readonly totalDemandMWh: number
  /** Generation assigned to this consumer by the matrix, before any matching cap is applied. */
  readonly totalSuppliedMWh: number
  readonly totalAllocatedMWh: number
  readonly totalMatchedMWh: number
  readonly totalExcessMWh: number
  readonly totalUnmatchedMWh: number
  readonly monthlyScores: readonly number[]
  readonly monthlyDemandMWh: readonly number[]
  readonly monthlyMatchedMWh: readonly number[]
  readonly monthlyExcessMWh: readonly number[]
  readonly monthlyUnmatchedMWh: readonly number[]
  readonly demandMWh: HourlySeries
  readonly allocatedMWh: HourlySeries
  readonly matchedMWh: HourlySeries
  readonly excessMWh: HourlySeries
  readonly unmatchedMWh: HourlySeries
  /** 0–100 per hour; 0 where there is no demand. */
  readonly hourlyMatchPct: HourlySeries
}

export interface ConsumerResult extends MatchingSummary {
  readonly consumerId: string
  readonly generators: readonly GeneratorContribution[]
}

export interface GeneratorUtilisation {
  readonly generatorId: string
  readonly totalGenerationMWh: number
  readonly allocatedMWh: number
  readonly unallocatedMWh: number
  /** consumerId → MWh allocated to that consumer */
  readonly allocatedByConsumer: Readonly<Record<string, number>>
}

export interface EngineResult {
  readonly granularity: MatchingGranularity
  readonly portfolio: MatchingSummary
  readonly consumers: readonly ConsumerResult[]
  readonly generators: readonly GeneratorUtilisation[]
}
