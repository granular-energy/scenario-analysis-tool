/**
 * Chart 2 — Hourly matching heatmap.
 * 12 rows (months, Jan at top) x 24 columns (hours 0-23).
 * Cell colour intensity = average matched share for that month/hour combination.
 */

import type Highcharts from 'highcharts'
import { MONTH_START_HOUR, MONTH_NAMES } from '../../../engine/typicalYear'
import type { MatchingSummary } from '../../../engine/types'
import { CHART_FONT_FAMILY, AXIS_LABEL_COLOUR, HEATMAP_GRADIENT_STOPS, WHITE } from './palette'

/** Build a 12x24 matrix of average match percentages from hourlyMatchPct. */
export function buildHeatmapMatrix(hourlyMatchPct: readonly number[]): number[][] {
  const matrix: number[][] = []
  for (let m = 0; m < 12; m++) {
    const row: number[] = new Array(24).fill(0)
    const counts: number[] = new Array(24).fill(0)
    const start = MONTH_START_HOUR[m]
    const end = MONTH_START_HOUR[m + 1]
    for (let h = start; h < end; h++) {
      const hourOfDay = h % 24
      row[hourOfDay] += hourlyMatchPct[h]
      counts[hourOfDay]++
    }
    // Average
    for (let hod = 0; hod < 24; hod++) {
      row[hod] = counts[hod] > 0 ? row[hod] / counts[hod] : 0
    }
    matrix.push(row)
  }
  return matrix
}

/** Flatten the 12x24 matrix into Highcharts heatmap data points [x, y, value]. */
export function matrixToHeatmapData(matrix: readonly number[][]): Array<[number, number, number]> {
  const data: Array<[number, number, number]> = []
  for (let m = 0; m < 12; m++) {
    for (let h = 0; h < 24; h++) {
      data.push([h, m, Math.round(matrix[m][h] * 100) / 100])
    }
  }
  return data
}

export function buildHeatmapConfig(summary: MatchingSummary): Highcharts.Options {
  const matrix = buildHeatmapMatrix(summary.hourlyMatchPct)
  const data = matrixToHeatmapData(matrix)

  const hourCategories = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))

  return {
    chart: {
      type: 'heatmap',
      backgroundColor: 'transparent',
      spacing: [20, 0, 10, 0],
      animation: false,
      style: { fontFamily: CHART_FONT_FAMILY },
    },
    title: { text: undefined },
    credits: { enabled: false },
    xAxis: {
      categories: hourCategories,
      title: { text: undefined },
      labels: {
        style: {
          fontFamily: CHART_FONT_FAMILY,
          fontSize: '11px',
          color: AXIS_LABEL_COLOUR,
        },
      },
      tickLength: 0,
    },
    yAxis: {
      categories: [...MONTH_NAMES],
      title: { text: undefined },
      reversed: true,
      gridLineWidth: 0,
      labels: {
        style: {
          fontFamily: CHART_FONT_FAMILY,
          fontSize: '11px',
          color: AXIS_LABEL_COLOUR,
        },
      },
    },
    colorAxis: {
      min: 0,
      max: 100,
      stops: [...HEATMAP_GRADIENT_STOPS],
      labels: {
        format: '{value}%',
        style: {
          fontFamily: CHART_FONT_FAMILY,
          fontSize: '10px',
          color: AXIS_LABEL_COLOUR,
        },
      },
    },
    legend: {
      enabled: true,
      align: 'right',
      verticalAlign: 'bottom',
      layout: 'horizontal',
      symbolWidth: 200,
      itemStyle: {
        fontFamily: CHART_FONT_FAMILY,
        fontSize: '10px',
        fontWeight: '500',
        color: AXIS_LABEL_COLOUR,
      },
    },
    tooltip: {
      pointFormat: '<b>{point.value:.1f}%</b> match',
      style: {
        fontFamily: CHART_FONT_FAMILY,
        fontSize: '12px',
      },
    },
    series: [
      {
        type: 'heatmap' as const,
        data,
        borderWidth: 1,
        borderColor: WHITE,
        dataLabels: { enabled: false },
      },
    ],
    plotOptions: {
      series: { animation: false },
    },
  }
}
