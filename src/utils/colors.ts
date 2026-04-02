// Technology colours from Granular platform design system
// Uses pattern matching so new profiles get sensible colours automatically

const COLOR_PATTERNS: [RegExp, string][] = [
  [/onshore.*wind/i, '#58CAA1'],
  [/offshore.*wind/i, '#A6E5CF'],
  [/wind/i, '#81D8B9'],
  [/solar/i, '#FDCF77'],
  [/hydro/i, '#6EA1DD'],
  [/nuclear|baseload/i, '#AB80CC'],
  [/biomass/i, '#57B06B'],
  [/battery|storage/i, '#CBC0E9'],
  [/gas/i, '#E86571'],
  [/geothermal/i, '#F3A45B'],
]

const FALLBACK_COLORS = ['#8195A9', '#F398CD', '#BAD9F6', '#B9E198', '#355A8C']
let fallbackIndex = 0

const cache = new Map<string, string>()

export function getTechnologyColor(technology: string): string {
  const cached = cache.get(technology)
  if (cached) return cached

  for (const [pattern, color] of COLOR_PATTERNS) {
    if (pattern.test(technology)) {
      cache.set(technology, color)
      return color
    }
  }

  const color = FALLBACK_COLORS[fallbackIndex % FALLBACK_COLORS.length]
  fallbackIndex++
  cache.set(technology, color)
  return color
}
