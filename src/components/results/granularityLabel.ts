/** Full labels and method context for each matching granularity, used in the Results header and score strip. */

import type { MatchingGranularity } from '../../engine/types'

export interface GranularityInfo {
  /** Short label, e.g. "Hourly matching only". */
  readonly label: string
  /** Cap rule phrase, e.g. "capped at hourly consumption". */
  readonly capRule: string
  /** Shape rule phrase, e.g. "generator shape preserved". */
  readonly shapeRule: string
}

const INFO: Record<MatchingGranularity, GranularityInfo> = {
  hourly: {
    label: 'Hourly matching only',
    capRule: 'capped at hourly consumption',
    shapeRule: 'no over-allocation possible',
  },
  monthly: {
    label: 'Monthly matching target',
    capRule: 'allocation capped at monthly consumption',
    shapeRule: 'generator shape preserved',
  },
  annual: {
    label: 'Annual matching target',
    capRule: 'allocation capped at annual consumption',
    shapeRule: 'generator shape preserved',
  },
  'as-produced': {
    label: 'As produced (no cap)',
    capRule: 'no cap',
    shapeRule: 'generator shape preserved',
  },
}

/** Returns the display label for a matching granularity. */
export function granularityLabel(granularity: MatchingGranularity): string {
  return INFO[granularity].label
}

/** Returns the full method context info for a matching granularity. */
export function granularityInfo(granularity: MatchingGranularity): GranularityInfo {
  return INFO[granularity]
}

/** Returns the full header line: "label · cap rule · shape rule". */
export function granularityHeaderLine(granularity: MatchingGranularity): string {
  const info = INFO[granularity]
  return `${info.label} · ${info.capRule} · ${info.shapeRule}`
}

/** Tooltip text for "shape preserved". */
export const SHAPE_PRESERVED_TOOLTIP =
  "A generator's allocation follows its own hourly output shape and is not redistributed into other hours. The allocated volume in each hour is proportional to the generator's actual output in that hour."
