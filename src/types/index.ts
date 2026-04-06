/** Time resolution of a profile, auto-detected from CSV timestamps */
export type Resolution = 'hourly' | 'half-hourly'

/** A timestamped timeseries of raw MWh values */
export interface TimeSeries {
  timestamps: number[]  // Unix epoch ms, one per interval
  values: number[]      // Raw MWh, same length as timestamps
  resolution: Resolution
}

/** A consumer or generator uploaded by the user */
export interface PortfolioProfile {
  id: string
  name: string
  role: 'consumer' | 'generator'
  timeSeries: TimeSeries
}

/** Allocation matrix: generatorId → consumerId → percentage (0-100) */
export type AllocationMatrix = Record<string, Record<string, number>>

/** Date range for filtering calculations */
export interface DateRange {
  start: number  // Unix epoch ms
  end: number    // Unix epoch ms
}

/** Per-consumer matching result */
export interface ConsumerResult {
  consumerId: string
  cfeScore: number
  annualScore: number
  hourlyMatchedMWh: number[]
  hourlyConsumptionMWh: number[]
  hourlyMatchingPercentage: number[]
  monthlyScores: number[]
  generatorContributions: GeneratorContribution[]
}

/** Per-generator contribution to a consumer's matching */
export interface GeneratorContribution {
  generatorId: string
  generatorName: string
  monthlyMatchedMWh: number[]
  totalAllocatedMWh: number
}

/** Sankey diagram link */
export interface SankeyLink {
  from: string
  to: string
  weight: number
}

/** App state for the portfolio context */
export interface PortfolioState {
  consumers: PortfolioProfile[]
  generators: PortfolioProfile[]
  allocationMatrix: AllocationMatrix
  dateRange: DateRange | null
  activeTab: 'portfolio' | 'allocations' | 'results'
  selectedConsumerId: string | null
}

/** Actions for the portfolio reducer */
export type PortfolioAction =
  | { type: 'ADD_PROFILE'; profile: PortfolioProfile }
  | { type: 'REMOVE_PROFILE'; id: string; role: 'consumer' | 'generator' }
  | { type: 'SET_ALLOCATION'; generatorId: string; consumerId: string; percentage: number }
  | { type: 'SET_DATE_RANGE'; range: DateRange }
  | { type: 'SET_ACTIVE_TAB'; tab: PortfolioState['activeTab'] }
  | { type: 'SELECT_CONSUMER'; consumerId: string }
