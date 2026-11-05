/**
 * Chart 4 — Example day picker.
 * 24 hourly bars: matched per generator (technology colours) → excess per generator
 * (pastel) → hatched unmatched → demand spline on top.
 */

import type Highcharts from 'highcharts'
import {
  DEMAND_COLOUR,
  UNALLOCATED_BG,
  UNALLOCATED_STRIPE,
  techAllocatedColour,
  techExcessColour,
} from './palette'
import { mergeDefaults } from './chartDefaults'

export interface ExampleDayGeneratorInput {
  name: string
  technology: string
  /** 8 760-length hourly matched MWh. */
  matchedMWh: readonly number[]
  /** 8 760-length hourly excess MWh. */
  excessMWh: readonly number[]
}

export interface ExampleDayInput {
  /** Day of year index (0–364). */
  dayIndex: number
  demandMWh: readonly number[]
  unmatchedMWh: readonly number[]
  generators: readonly ExampleDayGeneratorInput[]
}

/** Extract 24 hours for a given day index from an 8 760-length series. */
export function sliceDay(series: readonly number[], dayIndex: number): number[] {
  const start = dayIndex * 24
  return series.slice(start, start + 24) as number[]
}

/** Check whether a 24-element day slice has a meaningful total. */
function hasSignificantDay(daySlice: readonly number[], threshold = 0.01): boolean {
  let total = 0
  for (let i = 0; i < daySlice.length; i++) {
    total += daySlice[i]
  }
  return total >= threshold
}

export function buildExampleDayConfig(input: ExampleDayInput): Highcharts.Options {
  const demandDay = sliceDay(input.demandMWh, input.dayIndex)
  const unmatchedDay = sliceDay(input.unmatchedMWh, input.dayIndex)

  // Matched bars per generator (bottom of stack)
  const matchedSeries: Highcharts.SeriesOptionsType[] = input.generators.map((g) => ({
    type: 'column' as const,
    name: g.name,
    data: sliceDay(g.matchedMWh, input.dayIndex),
    color: techAllocatedColour(g.technology),
    stacking: 'normal' as const,
  }))

  // Excess bars per generator (pastel, above matched)
  const excessSeries: Highcharts.SeriesOptionsType[] = input.generators
    .map((g) => {
      const excessDay = sliceDay(g.excessMWh, input.dayIndex)
      return { g, excessDay }
    })
    .filter(({ excessDay }) => hasSignificantDay(excessDay))
    .map(({ g, excessDay }) => ({
      type: 'column' as const,
      name: `${g.name} in excess`,
      data: excessDay,
      color: techExcessColour(g.technology),
      stacking: 'normal' as const,
    }))

  const unmatchedSeries: Highcharts.SeriesOptionsType = {
    type: 'column' as const,
    name: 'Unmatched',
    data: unmatchedDay,
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

  const demandSeries: Highcharts.SeriesOptionsType = {
    type: 'spline' as const,
    name: 'Demand',
    data: demandDay,
    color: DEMAND_COLOUR,
    lineWidth: 2,
    marker: { enabled: false },
    zIndex: 10,
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

/**
 * Convert a Date-like value to a day-of-year index (0-based).
 * 1 Jan = 0, 1 May = 120, etc.
 */
export function dateToDayIndex(month: number, day: number): number {
  const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let idx = 0
  for (let m = 0; m < month - 1; m++) {
    idx += DAYS_IN_MONTH[m]
  }
  return idx + day - 1
}

/** Convert a day-of-year index back to month (1-based) and day (1-based). */
export function dayIndexToDate(dayIndex: number): { month: number; day: number } {
  const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let remaining = dayIndex
  for (let m = 0; m < 12; m++) {
    if (remaining < DAYS_IN_MONTH[m]) {
      return { month: m + 1, day: remaining + 1 }
    }
    remaining -= DAYS_IN_MONTH[m]
  }
  return { month: 12, day: 31 }
}

/** Default day index: 1 May = day 120 (31+28+31+30 = 120). */
export const DEFAULT_DAY_INDEX = 120
