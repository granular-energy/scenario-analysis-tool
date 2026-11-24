/**
 * CompareChart: renders an overlaid monthly score spline chart for selected scenarios.
 * Uses the Chart wrapper from the Results tab with a config built by compareChartConfig.
 */

import { useMemo } from 'react'
import type { SavedScenario } from '../../io/scenarioIO'
import { Chart } from '../results/Chart'
import { buildCompareChartConfig } from './compareChartConfig'

interface CompareChartProps {
  readonly scenarios: readonly SavedScenario[]
}

export function CompareChart({ scenarios }: CompareChartProps) {
  const chartOptions = useMemo(
    () =>
      buildCompareChartConfig({
        scenarios: scenarios.map((s) => ({
          name: s.name,
          monthlyScores: s.results.monthlyScores,
        })),
      }),
    [scenarios],
  )

  return (
    <div className="content-card" data-testid="compare-chart">
      <h3 className="compare-section-title">Monthly matching scores</h3>
      <Chart options={chartOptions} />
    </div>
  )
}
