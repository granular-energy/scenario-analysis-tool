import Highcharts, { HighchartsReact } from '../../highcharts'
import { useMemo } from 'react'
import { COMPARISON_COLORS } from './ScenarioColumn'

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

interface ScenarioMonthlyData {
  name: string
  monthlyScores: number[]
}

interface ComparisonMonthlyChartProps {
  scenarios: ScenarioMonthlyData[]
}

function ComparisonMonthlyChart({ scenarios }: ComparisonMonthlyChartProps) {
  const options = useMemo<Highcharts.Options>(() => ({
    chart: {
      type: 'column',
      style: { fontFamily: "'Inter', Arial, sans-serif" },
    },
    title: {
      text: 'Monthly CFE Score Comparison',
    },
    xAxis: {
      categories: MONTH_LABELS,
      crosshair: true,
    },
    yAxis: {
      min: 0,
      max: 100,
      title: { text: 'CFE Score (%)' },
    },
    tooltip: {
      shared: true,
      valueSuffix: '%',
      valueDecimals: 1,
    },
    plotOptions: {
      column: {
        borderWidth: 0,
      },
    },
    series: scenarios.map((s, i) => ({
      type: 'column' as const,
      name: s.name,
      data: s.monthlyScores.map((v) => Math.round(v * 10) / 10),
      color: COMPARISON_COLORS[i] ?? COMPARISON_COLORS[0],
    })),
    credits: { enabled: false },
  }), [scenarios])

  return (
    <div className="comparison-monthly-chart">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  )
}

export default ComparisonMonthlyChart
