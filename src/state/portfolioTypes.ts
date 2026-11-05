/** Types for the portfolio state — consumers, generators, allocation matrix, and granularity. */

import type { MatchingGranularity } from '../engine/types'

export interface PortfolioConsumer {
  readonly uid: string
  readonly profileId: string
  readonly name: string
  readonly annualMWh: number
  /** Normalised hourly shape (sum ≈ 1.0), 8 760 values. */
  readonly shape: readonly number[]
  readonly source: 'library' | 'upload'
}

export interface PortfolioGenerator {
  readonly uid: string
  readonly profileId: string
  readonly name: string
  readonly annualMWh: number
  readonly capacityFactor: number
  readonly technology: string
  /** Normalised hourly shape (sum ≈ 1.0), 8 760 values. */
  readonly shape: readonly number[]
  readonly source: 'library' | 'upload'
}

/** generatorUid → consumerUid → percent (0–100). */
export type PortfolioMatrix = Record<string, Record<string, number>>

export interface PortfolioState {
  readonly consumers: readonly PortfolioConsumer[]
  readonly generators: readonly PortfolioGenerator[]
  readonly matrix: PortfolioMatrix
  readonly granularity: MatchingGranularity
}

export type PortfolioAction =
  | { type: 'ADD_CONSUMER'; consumer: PortfolioConsumer }
  | { type: 'REMOVE_CONSUMER'; uid: string }
  | { type: 'UPDATE_CONSUMER_SIZING'; uid: string; annualMWh: number }
  | { type: 'ADD_GENERATOR'; generator: PortfolioGenerator }
  | { type: 'REMOVE_GENERATOR'; uid: string }
  | { type: 'UPDATE_GENERATOR_SIZING'; uid: string; annualMWh: number }
  | { type: 'SET_ALLOCATION'; generatorUid: string; consumerUid: string; percent: number }
  | { type: 'ALLOCATE_EVENLY' }
  | { type: 'SET_GRANULARITY'; granularity: MatchingGranularity }
  | { type: 'LOAD_STATE'; state: PortfolioState }

export const MAX_CONSUMERS = 5
export const MAX_GENERATORS = 5
