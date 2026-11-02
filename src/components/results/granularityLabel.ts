/** Plain-English descriptions of each matching granularity. */

import type { MatchingGranularity } from '../../engine/types'

const LABELS: Record<MatchingGranularity, string> = {
  hourly: 'Hourly matching, shape preserved within each hour',
  monthly: 'Monthly matching, shape preserved within each month',
  annual: 'Annual matching, shape preserved within the year',
}

export function granularityLabel(granularity: MatchingGranularity): string {
  return LABELS[granularity]
}
