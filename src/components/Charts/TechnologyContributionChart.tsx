import Highcharts, { HighchartsReact } from '../../highcharts'
import { useMemo } from 'react'
import type { TechnologyContribution } from '../../types'

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const TECHNOLOGY_COLORS: Record<string, string> = {
  'Wind Onshore': '#58CAA1',
  'Solar PV': '#FDCF77',
  'Hydro': '#6EA1DD',
}

interface TechnologyContributionChartProps {
  technologyContributions: TechnologyContribution[]
  monthlyConsumption: number[]
}

function TechnologyContributionChart({
  technologyContributions,
  monthlyConsumption,
}: TechnologyContributionChartProps) {
  const series = useMemo<Highcharts.SeriesOptionsType[]>(() => {
    return technologyContributions.map((contrib) => ({
      type: 'column' as const,
      name: contrib.name,
      data: contrib.monthlyMatched.map((matched, i) => {
        const consumption = monthlyConsumption[i]
        return consumption > 0
          ? Math.round((matched / consumption) * 1000) / 10
          : 0
      }),
      color: TECHNOLOGY_COLORS[contrib.technology] ?? undefined,
      stacking: 'normal' as const,
    }))
  }, [technologyContributions, monthlyConsumption])

  const options = useMemo<Highcharts.Options>(() => ({
    chart: {
      type: 'column',
      style: { fontFamily: "'Inter', Arial, sans-serif" },
    },
    title: {
      text: 'Monthly Technology Contribution to CFE',
    },
    xAxis: {
      categories: MONTH_LABELS,
      crosshair: true,
    },
    yAxis: {
      min: 0,
      max: 100,
      title: { text: 'CFE Contribution (%)' },
    },
    plotOptions: {
      column: {
        stacking: 'normal',
      },
    },
    tooltip: {
      shared: true,
      formatter: function (this: Highcharts.Point): string {
        const points = (this as unknown as { points: Highcharts.Point[] }).points
        if (!points) return ''
        let html = `<b>${points[0].key as string}</b><br/>`
        let total = 0
        for (const point of points) {
          const val = point.y as number
          total += val
          html += `<span style="color:${point.color as string}">\u25CF</span> ${point.series.name}: ${val.toFixed(1)}%<br/>`
        }
        html += `<b>Total: ${total.toFixed(1)}%</b>`
        return html
      },
    },
    series,
    credits: { enabled: false },
  }), [series])

  return (
    <div className="technology-contribution-chart">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  )
}

export default TechnologyContributionChart
