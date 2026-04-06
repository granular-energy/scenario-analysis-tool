import Highcharts, { HighchartsReact } from '../../highcharts'
import { useMemo } from 'react'

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

interface HourlyHeatmapProps {
  timestamps: number[]
  hourlyMatchingPercentage: number[]
}

function HourlyHeatmap({ timestamps, hourlyMatchingPercentage }: HourlyHeatmapProps) {
  const { data, maxDay, monthTicks } = useMemo(() => {
    if (timestamps.length === 0) return { data: [], maxDay: 0, monthTicks: [] }

    const startDate = new Date(timestamps[0])
    const startOfYear = Date.UTC(startDate.getUTCFullYear(), 0, 1)
    const msPerDay = 86_400_000

    const points: [number, number, number][] = []
    const seenMonths = new Set<number>()
    let maxD = 0

    for (let i = 0; i < timestamps.length; i++) {
      const d = new Date(timestamps[i])
      const dayOffset = Math.floor((timestamps[i] - startOfYear) / msPerDay)
      const hour = d.getUTCHours()
      const val = Math.round((hourlyMatchingPercentage[i] ?? 0) * 10) / 10
      points.push([dayOffset, hour, val])
      if (dayOffset > maxD) maxD = dayOffset
      seenMonths.add(d.getUTCMonth())
    }

    // Build month tick positions
    const ticks: { day: number; label: string }[] = []
    const monthStartDays = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    for (let m = 0; m < 12; m++) {
      if (seenMonths.has(m) && monthStartDays[m] <= maxD) {
        ticks.push({ day: monthStartDays[m], label: MONTH_LABELS[m] })
      }
    }

    return { data: points, maxDay: maxD, monthTicks: ticks }
  }, [timestamps, hourlyMatchingPercentage])

  const options = useMemo<Highcharts.Options>(() => ({
    chart: {
      type: 'heatmap',
      height: 400,
      style: { fontFamily: "'Inter', Arial, sans-serif" },
    },
    title: {
      text: 'Hourly CFE Matching',
    },
    xAxis: {
      title: { text: undefined },
      tickPositions: monthTicks.map((t) => t.day),
      labels: {
        formatter: function (this: Highcharts.AxisLabelsFormatterContextObject): string {
          const tick = monthTicks.find((t) => t.day === this.value)
          return tick?.label ?? ''
        },
      },
      min: 0,
      max: maxDay,
    },
    yAxis: {
      title: { text: 'Hour of Day' },
      reversed: true,
      min: 0,
      max: 23,
      tickInterval: 3,
      labels: {
        formatter: function (this: Highcharts.AxisLabelsFormatterContextObject): string {
          return `${String(this.value as number).padStart(2, '0')}:00`
        },
      },
    },
    colorAxis: {
      min: 0,
      max: 100,
      stops: [
        [0, '#dc2626'],
        [0.5, '#facc15'],
        [1, '#00988b'],
      ],
      labels: { format: '{value}%' },
    },
    tooltip: {
      formatter: function (this: Highcharts.Point): string {
        const point = this as unknown as { x: number; y: number; value: number }
        const hour = `${String(point.y).padStart(2, '0')}:00`
        return `Day ${point.x + 1}, ${hour} — ${point.value.toFixed(0)}%`
      },
    },
    series: [{
      type: 'heatmap' as const,
      name: 'CFE Matching',
      data,
      colsize: 1,
      rowsize: 1,
      borderWidth: 0,
      nullColor: '#e5e7eb',
    }],
    legend: {
      align: 'right' as const,
      layout: 'vertical' as const,
      verticalAlign: 'middle' as const,
    },
    credits: { enabled: false },
  }), [data, maxDay, monthTicks])

  if (data.length === 0) return null

  return (
    <div className="hourly-heatmap">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  )
}

export default HourlyHeatmap
