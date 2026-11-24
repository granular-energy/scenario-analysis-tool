/**
 * Chart config builder for the Compare tab monthly score overlay.
 * Pure function: takes scenario names and their monthly scores, returns Highcharts options.
 */

import type Highcharts from 'highcharts'
import { mergeDefaults } from '../results/charts/chartDefaults'
import { CHART_FONT_FAMILY } from '../results/charts/palette'

/** Series colours for up to 4 scenarios, matching --ge-series-1..4 in tokens.css. */
const SERIES_COLOURS = ['#00988b', '#e9a23b', '#0f4974', '#ab80cc'] as const

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export interface CompareChartInput {
  readonly scenarios: ReadonlyArray<{
    readonly name: string
    readonly monthlyScores: readonly number[]
  }>
}

/** Builds a Highcharts spline config for overlaid monthly scores. */
export function buildCompareChartConfig(input: CompareChartInput): Highcharts.Options {
  const series: Highcharts.SeriesOptionsType[] = input.scenarios.map((scenario, idx) => ({
    type: 'spline' as const,
    name: scenario.name,
    data: [...scenario.monthlyScores],
    color: SERIES_COLOURS[idx % SERIES_COLOURS.length],
    lineWidth: 2,
    marker: {
      enabled: true,
      radius: 3,
      symbol: 'circle',
    },
  }))

  return mergeDefaults({
    chart: {
      type: 'spline',
      height: 320,
    },
    xAxis: {
      categories: [...MONTH_LABELS],
      crosshair: {
        width: 1,
        color: '#0F4974',
      },
    },
    yAxis: {
      title: { text: '%' },
      min: 0,
      max: 100,
      labels: {
        format: '{value}%',
        style: {
          fontFamily: CHART_FONT_FAMILY,
          fontSize: '11px',
        },
      },
    },
    tooltip: {
      shared: true,
      valueSuffix: ' %',
      valueDecimals: 2,
    },
    plotOptions: {
      spline: {
        marker: {
          enabled: true,
        },
      },
    },
    series,
  })
}
