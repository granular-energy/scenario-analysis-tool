import Highcharts, { HighchartsReact } from '../../highcharts'
import { useMemo } from 'react'

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface MonthlyBreakdownChartProps {
  monthlyScores: number[]
}

function MonthlyBreakdownChart({ monthlyScores }: MonthlyBreakdownChartProps) {
  const options = useMemo<Highcharts.Options>(() => ({
    chart: {
      type: 'column',
      style: { fontFamily: "'Space Grotesk', sans-serif" },
    },
    title: {
      text: 'Monthly CFE Score',
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
      formatter: function (this: Highcharts.Point): string {
        return `${this.category as string}: ${(this.y as number).toFixed(1)}%`
      },
    },
    series: [
      {
        type: 'column' as const,
        name: 'CFE Score',
        data: monthlyScores.map((score) => Math.round(score * 10) / 10),
        color: '#00988b',
      },
    ],
    legend: { enabled: false },
    credits: { enabled: false },
  }), [monthlyScores])

  return (
    <div className="monthly-breakdown-chart">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  )
}

export default MonthlyBreakdownChart
