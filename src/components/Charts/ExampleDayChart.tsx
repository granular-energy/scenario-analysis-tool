import Highcharts, { HighchartsReact } from '../../highcharts'
import { useMemo } from 'react'
import type { Profile, GenerationMix } from '../../types'
import { scaleProfile } from '../../utils/matching'
import { getTechnologyColor } from '../../utils/colors'

interface ExampleDayChartProps {
  consumptionProfile: Profile
  generationMix: GenerationMix
  generationProfiles: Profile[]
}

// May 1st = day 120 (0-indexed), hour offset = 120 * 24 = 2880
const EXAMPLE_DAY_OFFSET = 2880

function ExampleDayChart({
  consumptionProfile,
  generationMix,
  generationProfiles,
}: ExampleDayChartProps) {
  const { consumption, techSeries, unmatchedData } = useMemo(() => {
    const totalAnnualConsumption = consumptionProfile.data.reduce((a, b) => a + b, 0)

    const cons = consumptionProfile.data.slice(EXAMPLE_DAY_OFFSET, EXAMPLE_DAY_OFFSET + 24)

    const totalGenByHour = new Array<number>(24).fill(0)
    const series: { name: string; technology: string; data: number[] }[] = []
    for (const genProfile of generationProfiles) {
      const pct = generationMix[genProfile.technology] ?? 0
      if (pct === 0) continue

      const scaled = scaleProfile(genProfile, pct, totalAnnualConsumption)
      const dayData = scaled.slice(EXAMPLE_DAY_OFFSET, EXAMPLE_DAY_OFFSET + 24)
      series.push({ name: genProfile.name, technology: genProfile.technology, data: dayData })
      for (let i = 0; i < 24; i++) {
        totalGenByHour[i] += dayData[i]
      }
    }

    const unmatched = cons.map((c, i) => Math.max(0, c - totalGenByHour[i]))

    return { consumption: cons, techSeries: series, unmatchedData: unmatched }
  }, [consumptionProfile, generationMix, generationProfiles])

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
        text: '1 May',
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
        area: {
          fillOpacity: 0.6,
          lineWidth: 1.5,
          marker: { enabled: false },
          stacking: 'normal',
        },
        line: {
          lineWidth: 2.5,
          marker: { enabled: false },
        },
      },
      series: [
        {
          type: 'line' as const,
          name: 'Consumption',
          data: consumption,
          color: '#1e1e1e',
          dashStyle: 'Solid' as const,
          zIndex: 10,
        },
        {
          type: 'area' as const,
          name: 'Unmatched consumption',
          data: unmatchedData,
          color: '#d4d4d4',
          lineColor: '#d4d4d4',
          fillOpacity: 0.7,
          stacking: 'normal' as Highcharts.OptionsStackingValue,
        },
        ...techSeries.map((s) => ({
          type: 'area' as const,
          name: s.name,
          data: s.data,
          color: getTechnologyColor(s.technology),
          stacking: 'normal' as Highcharts.OptionsStackingValue,
        })),
      ],
      credits: { enabled: false },
    }
  }, [consumption, techSeries, unmatchedData])

  return (
    <div className="example-day-chart">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  )
}

export default ExampleDayChart
