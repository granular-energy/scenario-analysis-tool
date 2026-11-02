/**
 * Technology colour palette for charts.
 * All colours come from design-system.md / tokens.css.
 * Components import from here — never hard-code hex values.
 */

/** Allocated (saturated) and excess (lighter) colours per technology key. */
export const TECH_COLOURS: Record<string, { allocated: string; excess: string }> = {
  solar: { allocated: '#FDCF77', excess: '#FEE0A7' },
  'wind-onshore': { allocated: '#58CAA1', excess: '#92DDC2' },
  'wind-offshore': { allocated: '#A6E5CF', excess: '#C5EEE0' },
  wind: { allocated: '#81D8B9', excess: '#ADE6D1' },
  hydro: { allocated: '#6EA1DD', excess: '#A1C2E9' },
  nuclear: { allocated: '#AB80CC', excess: '#C8ACDE' },
  biomass: { allocated: '#57B06B', excess: '#92CC9F' },
  battery: { allocated: '#CBC0E9', excess: '#DDD6F1' },
  geothermal: { allocated: '#F3A45B', excess: '#F7C494' },
  biogas: { allocated: '#F6AFAF', excess: '#F9CBCB' },
  gas: { allocated: '#E86571', excess: '#F09BA3' },
  coal: { allocated: '#A4776C', excess: '#C4A79F' },
  unknown: { allocated: '#B3BFC9', excess: '#CED5DC' },
}

/** Demand spline colour. */
export const DEMAND_COLOUR = '#0F4974'

/** Domain flow colours. */
export const MATCHED_COLOUR = '#007F8A'
export const UNALLOCATED_STRIPE = '#CEE7DF'
export const UNALLOCATED_BG = '#FAFAFA'
export const EXCESS_COLOUR = '#1FB084'

/** Look up the allocated colour for a technology string; falls back to unknown. */
export function techAllocatedColour(technology: string): string {
  return (TECH_COLOURS[technology] ?? TECH_COLOURS['unknown']).allocated
}

/** Look up the excess colour for a technology string; falls back to unknown. */
export function techExcessColour(technology: string): string {
  return (TECH_COLOURS[technology] ?? TECH_COLOURS['unknown']).excess
}

/** Granular chart base style: Inter font, dotted grids, no top/right borders. */
export const CHART_FONT_FAMILY = '"Inter", system-ui, sans-serif'

/** Shared axis / grid style to apply to Highcharts chart options. */
export const GRID_STYLE = {
  gridLineColor: 'rgba(0, 0, 0, 0.2)',
  gridLineDashStyle: 'Dot' as const,
  gridLineWidth: 1,
}

/** Axis line colour. */
export const AXIS_LINE_COLOUR = '#CED6E9'

/** Label colour (grey). */
export const AXIS_LABEL_COLOUR = '#666666'

/** Neutral text colours used for y-axis titles and Sankey data labels. */
export const NEUTRAL_600 = '#897F78'
export const NEUTRAL_1000 = '#2A2929'

/** White (cell borders, backgrounds). */
export const WHITE = '#FFFFFF'

/** Heatmap colour-axis gradient from off-white to deep teal/navy. */
export const HEATMAP_GRADIENT_STOPS: ReadonlyArray<[number, string]> = [
  [0, '#FBFAF9'],
  [0.25, '#E6F5F3'],
  [0.5, '#94D1CC'],
  [0.75, '#00988B'],
  [1, '#0F4974'],
]
