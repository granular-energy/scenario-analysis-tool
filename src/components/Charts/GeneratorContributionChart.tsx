import Highcharts, { HighchartsReact } from '../../highcharts'
import { useMemo } from 'react'
import type { GeneratorContribution } from '../../types'
import { getTechnologyColor } from '../../utils/colors'

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

interface GeneratorContributionChartProps {
  contributions: GeneratorContribution[]
  monthlyConsumptionMWh: number[]
}

function GeneratorContributionChart({
  contributions,
  monthlyConsumptionMWh,
}: GeneratorContributionChartProps) {
  const options = useMemo<Highcharts.Options>(() => ({
    chart: {
      type: 'column',
      style: { fontFamily: "'Inter', Arial, sans-serif" },
    },
    title: {
      text: 'Generator Contribution',
    },
    xAxis: {
      categories: MONTH_LABELS,
      crosshair: true,
    },
    yAxis: {
      min: 0,
      max: 100,
      title: { text: 'Matched (%)' },
    },
    tooltip: {
      shared: true,
      formatter: function (this: Highcharts.Point): string {
        const points = (this as unknown as { points: Highcharts.Point[] }).points
        if (!points) return ''
        let html = `<b>${points[0].key as string}</b><br/>`
        for (const point of points) {
          html += `<span style="color:${point.color as string}">\u25CF</span> ${point.series.name}: ${(point.y as number).toFixed(1)}%<br/>`
        }
        return html
      },
    },
    plotOptions: {
      column: {
        stacking: 'normal',
        borderWidth: 0,
      },
    },
    series: contributions.map((c) => ({
      type: 'column' as const,
      name: c.generatorName,
      data: c.monthlyMatchedMWh.map((matched, i) =>
        monthlyConsumptionMWh[i] > 0
          ? Math.round((matched / monthlyConsumptionMWh[i]) * 1000) / 10
          : 0
      ),
      color: getTechnologyColor(c.generatorName),
      stacking: 'normal' as Highcharts.OptionsStackingValue,
    })),
    credits: { enabled: false },
  }), [contributions, monthlyConsumptionMWh])

  if (contributions.length === 0) return null

  return (
    <div className="generator-contribution-chart">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  )
}

export default GeneratorContributionChart
