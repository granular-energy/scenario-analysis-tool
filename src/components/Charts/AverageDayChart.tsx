import Highcharts, { HighchartsReact } from '../../highcharts'
import { useMemo } from 'react'
import type { Profile, GenerationMix } from '../../types'
import { scaleProfile } from '../../utils/matching'

interface AverageDayChartProps {
  consumptionProfile: Profile
  generationMix: GenerationMix
  generationProfiles: Profile[]
}

const TECHNOLOGY_COLORS: Record<string, string> = {
  'Wind Onshore': '#58CAA1',
  'Solar PV': '#FDCF77',
  'Hydro': '#6EA1DD',
}

function AverageDayChart({
  consumptionProfile,
  generationMix,
  generationProfiles,
}: AverageDayChartProps) {
  const { avgConsumption, techSeries, unmatchedData } = useMemo(() => {
    const totalAnnualConsumption = consumptionProfile.data.reduce((a, b) => a + b, 0)
    const days = 365

    const consumptionByHour = new Array<number>(24).fill(0)
    for (let h = 0; h < 8760; h++) {
      consumptionByHour[h % 24] += consumptionProfile.data[h]
    }
    const avgCons = consumptionByHour.map((v) => v / days)

    const totalGenByHour = new Array<number>(24).fill(0)
    const series: { name: string; technology: string; data: number[] }[] = []
    for (const genProfile of generationProfiles) {
      const pct = generationMix[genProfile.technology] ?? 0
      if (pct === 0) continue

      const scaled = scaleProfile(genProfile, pct, totalAnnualConsumption)
      const byHour = new Array<number>(24).fill(0)
      for (let h = 0; h < 8760; h++) {
        byHour[h % 24] += scaled[h]
      }
      const avgGen = byHour.map((v) => v / days)
      series.push({ name: genProfile.name, technology: genProfile.technology, data: avgGen })
      for (let i = 0; i < 24; i++) {
        totalGenByHour[i] += avgGen[i]
      }
    }

    // Unmatched = area between consumption and generation (only where cons > gen)
    // Stacked on top of generation so generation + unmatched = consumption in those hours
    const unmatched = avgCons.map((cons, i) => Math.max(0, cons - totalGenByHour[i]))

    return { avgConsumption: avgCons, techSeries: series, unmatchedData: unmatched }
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
        text: 'Average 24-Hour Profile',
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
        // Consumption as a line on top of everything
        {
          type: 'line' as const,
          name: 'Consumption',
          data: avgConsumption,
          color: '#1e1e1e',
          dashStyle: 'Solid' as const,
          zIndex: 10,
        },
        // Unmatched stacked on top of generation (grey band between gen and consumption)
        {
          type: 'area' as const,
          name: 'Unmatched consumption',
          data: unmatchedData,
          color: '#d4d4d4',
          lineColor: '#d4d4d4',
          fillOpacity: 0.7,
          stacking: 'normal' as Highcharts.OptionsStackingValue,
        },
        // Generation technologies stacked underneath
        ...techSeries.map((s) => ({
          type: 'area' as const,
          name: s.name,
          data: s.data,
          color: TECHNOLOGY_COLORS[s.technology] ?? '#888',
          stacking: 'normal' as Highcharts.OptionsStackingValue,
        })),
      ],
      credits: { enabled: false },
    }
  }, [avgConsumption, techSeries, unmatchedData])

  return (
    <div className="average-day-chart">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  )
}

export default AverageDayChart
