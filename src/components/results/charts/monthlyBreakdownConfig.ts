/**
 * Chart 3 — Monthly breakdown.
 * 12 x-axis categories (Jan–Dec). Stacked bars: matched per generator (technology
 * colours) → excess per generator (pastel) → unmatched (hatched). Demand spline
 * (monthly score line) on secondary y-axis (0–100 %).
 */

import type Highcharts from 'highcharts'
import { MONTH_NAMES } from '../../../engine/typicalYear'
import {
  AXIS_LABEL_COLOUR,
  AXIS_LINE_COLOUR,
  CHART_FONT_FAMILY,
  DEMAND_COLOUR,
  GRID_STYLE,
  NEUTRAL_600,
  UNALLOCATED_BG,
  UNALLOCATED_STRIPE,
  techAllocatedColour,
  techExcessColour,
} from './palette'
import { mergeDefaults } from './chartDefaults'

export interface MonthlyBreakdownGeneratorInput {
  name: string
  technology: string
  monthlyMatchedMWh: readonly number[]
  /** Monthly excess = monthlyAllocated - monthlyMatched. Pre-computed by the caller. */
  monthlyExcessMWh: readonly number[]
}

export interface MonthlyBreakdownInput {
  monthlyScores: readonly number[]
  monthlyUnmatchedMWh: readonly number[]
  generators: readonly MonthlyBreakdownGeneratorInput[]
}

export function buildMonthlyBreakdownConfig(input: MonthlyBreakdownInput): Highcharts.Options {
  // Matched bars per generator (bottom of stack, technology colours)
  const matchedSeries: Highcharts.SeriesOptionsType[] = input.generators.map((g) => ({
    type: 'column' as const,
    name: g.name,
    data: [...g.monthlyMatchedMWh],
    color: techAllocatedColour(g.technology),
    stacking: 'normal' as const,
    yAxis: 0,
  }))

  // Excess bars per generator (pastel colours, above matched)
  const excessSeries: Highcharts.SeriesOptionsType[] = input.generators
    .filter((g) => g.monthlyExcessMWh.some((v) => v >= 0.01))
    .map((g) => ({
      type: 'column' as const,
      name: `${g.name} in excess`,
      data: [...g.monthlyExcessMWh],
      color: techExcessColour(g.technology),
      stacking: 'normal' as const,
      yAxis: 0,
    }))

  // Unmatched (hatched, above excess)
  const unmatchedSeries: Highcharts.SeriesOptionsType = {
    type: 'column' as const,
    name: 'Unmatched',
    data: [...input.monthlyUnmatchedMWh],
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
    yAxis: 0,
  }

  // Monthly score line on secondary axis
  const scoreSeries: Highcharts.SeriesOptionsType = {
    type: 'spline' as const,
    name: 'Monthly score',
    data: [...input.monthlyScores],
    color: DEMAND_COLOUR,
    lineWidth: 2,
    marker: { enabled: true, radius: 3 },
    yAxis: 1,
    zIndex: 10,
  }

  // Y-axis title styling matching the design system: horizontal, at top
  const yAxisTitleStyle = {
    fontFamily: CHART_FONT_FAMILY,
    fontSize: '9px',
    color: NEUTRAL_600,
  }

  return mergeDefaults({
    xAxis: {
      categories: [...MONTH_NAMES],
      title: { text: undefined },
    },
    yAxis: [
      {
        ...GRID_STYLE,
        lineColor: AXIS_LINE_COLOUR,
        lineWidth: 1,
        title: {
          text: 'MWh',
          align: 'high' as const,
          rotation: 0,
          offset: 13,
          y: -10,
          style: yAxisTitleStyle,
        },
        labels: {
          style: {
            fontFamily: CHART_FONT_FAMILY,
            fontSize: '11px',
            color: AXIS_LABEL_COLOUR,
          },
        },
        min: 0,
      },
      {
        title: {
          text: '%',
          align: 'high' as const,
          rotation: 0,
          offset: 13,
          y: -10,
          style: yAxisTitleStyle,
        },
        labels: {
          style: {
            fontFamily: CHART_FONT_FAMILY,
            fontSize: '11px',
            color: AXIS_LABEL_COLOUR,
          },
        },
        min: 0,
        max: 100,
        opposite: true,
        gridLineWidth: 0,
      },
    ],
    series: [...matchedSeries, ...excessSeries, unmatchedSeries, scoreSeries],
  })
}
