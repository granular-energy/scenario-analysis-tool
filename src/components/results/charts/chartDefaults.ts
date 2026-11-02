/**
 * Shared Highcharts default options applied to every chart in the Results tab.
 * Granular style: Inter font, dotted grids, no top/right borders, legend below.
 */

import type Highcharts from 'highcharts'
import { AXIS_LABEL_COLOUR, AXIS_LINE_COLOUR, CHART_FONT_FAMILY, GRID_STYLE, NEUTRAL_600 } from './palette'

export const BASE_CHART_OPTIONS: Highcharts.Options = {
  chart: {
    backgroundColor: 'transparent',
    spacing: [20, 0, 10, 0],
    animation: false,
    style: { fontFamily: CHART_FONT_FAMILY },
  },
  title: { text: undefined },
  credits: { enabled: false },
  legend: {
    enabled: true,
    align: 'center',
    verticalAlign: 'bottom',
    layout: 'horizontal',
    itemStyle: {
      fontFamily: CHART_FONT_FAMILY,
      fontSize: '10px',
      fontWeight: '500',
      color: AXIS_LABEL_COLOUR,
    },
    margin: 16,
    padding: 0,
    symbolHeight: 10,
    symbolWidth: 16,
    symbolRadius: 2,
  },
  xAxis: {
    lineColor: AXIS_LINE_COLOUR,
    tickColor: AXIS_LINE_COLOUR,
    tickLength: 0,
    labels: {
      style: {
        fontFamily: CHART_FONT_FAMILY,
        fontSize: '11px',
        color: AXIS_LABEL_COLOUR,
      },
    },
  },
  yAxis: {
    ...GRID_STYLE,
    lineColor: AXIS_LINE_COLOUR,
    lineWidth: 1,
    min: 0,
    title: {
      align: 'high',
      rotation: 0,
      offset: 13,
      y: -10,
      style: {
        fontFamily: CHART_FONT_FAMILY,
        fontSize: '9px',
        color: NEUTRAL_600,
      },
    },
    labels: {
      style: {
        fontFamily: CHART_FONT_FAMILY,
        fontSize: '11px',
        color: AXIS_LABEL_COLOUR,
      },
    },
    opposite: false,
  },
  plotOptions: {
    series: {
      animation: false,
    },
    column: {
      borderRadius: 0,
      borderWidth: 0,
      groupPadding: 0,
      pointPadding: 0.1,
      stacking: 'normal',
    },
  },
  tooltip: {
    shared: true,
    style: {
      fontFamily: CHART_FONT_FAMILY,
      fontSize: '12px',
    },
  },
}

/** Merge base options with chart-specific overrides. */
export function mergeDefaults(overrides: Highcharts.Options): Highcharts.Options {
  return deepMerge(
    BASE_CHART_OPTIONS as unknown as Record<string, unknown>,
    overrides as unknown as Record<string, unknown>,
  ) as Highcharts.Options
}

/** Simple recursive merge of Highcharts option objects. */
function deepMerge(base: Record<string, unknown>, over: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base }
  for (const key of Object.keys(over)) {
    const baseVal = base[key]
    const overVal = over[key]
    if (
      baseVal &&
      overVal &&
      typeof baseVal === 'object' &&
      typeof overVal === 'object' &&
      !Array.isArray(baseVal) &&
      !Array.isArray(overVal)
    ) {
      result[key] = deepMerge(baseVal as Record<string, unknown>, overVal as Record<string, unknown>)
    } else {
      result[key] = overVal
    }
  }
  return result
}
