/**
 * Chart 1 — Average 24-hour profile.
 * Stacked bars: matched per generator (technology colours) → excess per generator
 * (pastel colours) → hatched unmatched → demand spline on top.
 */

import type Highcharts from 'highcharts'
import type { GeneratorContribution, MatchingSummary } from '../../../engine/types'
import {
  DEMAND_COLOUR,
  UNALLOCATED_BG,
  UNALLOCATED_STRIPE,
  techAllocatedColour,
  techExcessColour,
} from './palette'
import { mergeDefaults } from './chartDefaults'

export interface AverageDaySeriesInput {
  /** Generator name for display. */
  name: string
  /** Technology key for colour lookup. */
  technology: string
  /** 8 760-length hourly matched MWh. */
  matchedMWh: readonly number[]
  /** 8 760-length hourly excess MWh (allocated - matched). */
  excessMWh: readonly number[]
}

export interface AverageDayInput {
  /** 8 760-length demand series. */
  demandMWh: readonly number[]
  /** 8 760-length unmatched series. */
  unmatchedMWh: readonly number[]
  /** Per-generator matched and excess series with technology metadata. */
  generators: readonly AverageDaySeriesInput[]
}

/** Average a specific hour-of-day across all 365 days. */
export function averageByHour(series: readonly number[]): number[] {
  const result = new Array<number>(24).fill(0)
  for (let h = 0; h < 24; h++) {
    let total = 0
    for (let d = 0; d < 365; d++) {
      total += series[d * 24 + h]
    }
    result[h] = total / 365
  }
  return result
}

/** Check whether a 24-element averaged series has a meaningful total. */
function hasSignificantAvg(avgSeries: readonly number[], threshold = 0.01): boolean {
  let total = 0
  for (let i = 0; i < avgSeries.length; i++) {
    total += avgSeries[i]
  }
  return total >= threshold
}

export function buildAverageDayConfig(input: AverageDayInput): Highcharts.Options {
  const demandAvg = averageByHour(input.demandMWh)
  const unmatchedAvg = averageByHour(input.unmatchedMWh)

  // Matched bars per generator (bottom of stack)
  const matchedSeries: Highcharts.SeriesOptionsType[] = input.generators.map((g) => ({
    type: 'column' as const,
    name: g.name,
    data: averageByHour(g.matchedMWh),
    color: techAllocatedColour(g.technology),
    stacking: 'normal' as const,
  }))

  // Excess bars per generator (pastel, above matched)
  const excessSeries: Highcharts.SeriesOptionsType[] = input.generators
    .map((g) => {
      const avgExcess = averageByHour(g.excessMWh)
      return { g, avgExcess }
    })
    .filter(({ avgExcess }) => hasSignificantAvg(avgExcess))
    .map(({ g, avgExcess }) => ({
      type: 'column' as const,
      name: `${g.name} in excess`,
      data: avgExcess,
      color: techExcessColour(g.technology),
      stacking: 'normal' as const,
    }))

  // Hatched unmatched series
  const unmatchedSeries: Highcharts.SeriesOptionsType = {
    type: 'column' as const,
    name: 'Unmatched',
    data: unmatchedAvg,
    color: {
      pattern: {
        path: { d: 'M 0 8 L 8 0 M -1 1 L 1 -1 M 7 9 L 9 7', strokeWidth: 3 },
        width: 8,
        height: 8,
        color: UNALLOCATED_STRIPE,
        backgroundColor: UNALLOCATED_BG,
      },
    } as Highcharts.ColorType,
    stacking: 'normal' as const,
  }

  // Demand spline on top
  const demandSeries: Highcharts.SeriesOptionsType = {
    type: 'spline' as const,
    name: 'Demand',
    data: demandAvg,
    color: DEMAND_COLOUR,
    lineWidth: 2,
    marker: { enabled: false },
    zIndex: 10,
    enableMouseTracking: true,
  }

  const categories = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))

  return mergeDefaults({
    xAxis: {
      categories,
      title: { text: undefined },
    },
    yAxis: {
      title: { text: 'MWh' },
    },
    series: [...matchedSeries, ...excessSeries, unmatchedSeries, demandSeries],
  })
}

/** Build AverageDayInput from a MatchingSummary and its generator contributions with technology metadata. */
export function buildAverageDayInput(
  summary: MatchingSummary,
  generators: readonly GeneratorContribution[],
  technologyMap: ReadonlyMap<string, string>,
  nameMap: ReadonlyMap<string, string>,
): AverageDayInput {
  return {
    demandMWh: summary.demandMWh,
    unmatchedMWh: summary.unmatchedMWh,
    generators: generators.map((g) => ({
      name: nameMap.get(g.generatorId) ?? g.generatorId,
      technology: technologyMap.get(g.generatorId) ?? 'unknown',
      matchedMWh: g.matchedMWh,
      excessMWh: g.allocatedMWh.map((a, i) => Math.max(0, a - g.matchedMWh[i])),
    })),
  }
}
