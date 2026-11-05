/** Full labels for each matching granularity, used in the Results header and score strip. */

import type { MatchingGranularity } from '../../engine/types'

const LABELS: Record<MatchingGranularity, string> = {
  hourly: 'Hourly matching only',
  monthly: 'Monthly matching target',
  annual: 'Annual matching target',
}

export function granularityLabel(granularity: MatchingGranularity): string {
  return LABELS[granularity]
}
