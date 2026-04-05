import Highcharts, { HighchartsReact } from '../../highcharts'
import { useMemo } from 'react'
import type { Profile, GenerationMix } from '../../types'
import { scaleProfile } from '../../utils/matching'
import { COMPARISON_COLORS } from './ScenarioColumn'

interface ScenarioExampleDayData {
  name: string
  consumptionProfile: Profile
  generationMix: GenerationMix
  generationProfiles: Profile[]
}

interface ComparisonExampleDayChartProps {
  scenarios: ScenarioExampleDayData[]
}

// May 1st = day 120 (0-indexed), hour offset = 120 * 24 = 2880
const EXAMPLE_DAY_OFFSET = 2880

function ComparisonExampleDayChart({ scenarios }: ComparisonExampleDayChartProps) {
  const series = useMemo(() => {
    const allSeries: Highcharts.SeriesOptionsType[] = []

    for (let i = 0; i < scenarios.length; i++) {
      const { name, consumptionProfile, generationMix, generationProfiles } = scenarios[i]
      const color = COMPARISON_COLORS[i] ?? COMPARISON_COLORS[0]
      const totalAnnualConsumption = consumptionProfile.data.reduce((a, b) => a + b, 0)

      // Consumption line
      const cons = consumptionProfile.data.slice(EXAMPLE_DAY_OFFSET, EXAMPLE_DAY_OFFSET + 24)
      allSeries.push({
        type: 'line',
        name: `${name} — Consumption`,
        data: cons,
        color,
        dashStyle: 'Solid',
        lineWidth: 2.5,
        marker: { enabled: false },
      })

      // Total generation line
      const totalGen = new Array<number>(24).fill(0)
      for (const genProfile of generationProfiles) {
        const pct = generationMix[genProfile.technology] ?? 0
        if (pct === 0) continue
        const scaled = scaleProfile(genProfile, pct, totalAnnualConsumption)
        const dayData = scaled.slice(EXAMPLE_DAY_OFFSET, EXAMPLE_DAY_OFFSET + 24)
        for (let h = 0; h < 24; h++) {
          totalGen[h] += dayData[h]
        }
      }
      allSeries.push({
        type: 'line',
        name: `${name} — Generation`,
        data: totalGen,
        color,
        dashStyle: 'ShortDash',
        lineWidth: 2,
        marker: { enabled: false },
      })
    }

    return allSeries
  }, [scenarios])

  const options = useMemo<Highcharts.Options>(() => {
    const hourLabels = Array.from({ length: 24 }, (_, i) =>
      `${String(i).padStart(2, '0')}:00`
    )

    return {
      chart: {
        style: { fontFamily: "'Inter', Arial, sans-serif" },
      },
      title: {
        text: 'Example 24-Hour Period',
      },
      subtitle: {
        text: '1 May — Solid = consumption, dashed = generation',
        style: { fontSize: '0.75rem', color: '#897F78' },
      },
      xAxis: {
        categories: hourLabels,
        tickInterval: 3,
        crosshair: true,
      },
      yAxis: {
        title: { text: 'Energy (normalised)' },
        min: 0,
      },
      tooltip: {
        shared: true,
        formatter: function (this: Highcharts.Point): string {
          const points = (this as unknown as { points: Highcharts.Point[] }).points
          if (!points) return ''
          let html = `<b>${points[0].key as string}</b><br/>`
          for (const point of points) {
            html += `<span style="color:${point.color as string}">\u25CF</span> ${point.series.name}: ${(point.y as number).toFixed(4)}<br/>`
          }
          return html
        },
      },
      plotOptions: {
        line: {
          lineWidth: 2,
          marker: { enabled: false },
        },
      },
      series,
      credits: { enabled: false },
    }
  }, [series])

  return (
    <div className="comparison-example-day-chart">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  )
}

export default ComparisonExampleDayChart
