import Highcharts, { HighchartsReact } from '../../highcharts'
import { useMemo } from 'react'

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const MONTH_START_DAYS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

function getDayOfYear(hour: number): number {
  return Math.floor(hour / 24)
}

function getHourOfDay(hour: number): number {
  return hour % 24
}

function formatDate(dayOfYear: number): string {
  let remaining = dayOfYear
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  for (let m = 0; m < 12; m++) {
    if (remaining < DAYS_IN_MONTH[m]) {
      return `${remaining + 1} ${monthNames[m]}`
    }
    remaining -= DAYS_IN_MONTH[m]
  }
  return `31 December`
}

interface HourlyHeatmapProps {
  hourlyMatchingPercentage: number[]
}

function HourlyHeatmap({ hourlyMatchingPercentage }: HourlyHeatmapProps) {
  const data = useMemo(() => {
    const points: [number, number, number][] = []
    for (let h = 0; h < 8760; h++) {
      const day = getDayOfYear(h)
      const hour = getHourOfDay(h)
      points.push([day, hour, Math.round(hourlyMatchingPercentage[h] * 10) / 10])
    }
    return points
  }, [hourlyMatchingPercentage])

  const options = useMemo<Highcharts.Options>(() => ({
    chart: {
      type: 'heatmap',
      height: 400,
      style: { fontFamily: "'Space Grotesk', sans-serif" },
    },
    title: {
      text: 'Hourly CFE Matching',
    },
    xAxis: {
      title: { text: undefined },
      tickPositions: MONTH_START_DAYS,
      labels: {
        formatter: function (this: Highcharts.AxisLabelsFormatterContextObject): string {
          const dayIndex = this.value as number
          const monthIndex = MONTH_START_DAYS.indexOf(dayIndex)
          return monthIndex >= 0 ? MONTH_LABELS[monthIndex] : ''
        },
      },
      min: 0,
      max: 364,
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
      labels: {
        format: '{value}%',
      },
    },
    tooltip: {
      formatter: function (this: Highcharts.Point): string {
        const point = this as unknown as { x: number; y: number; value: number }
        const date = formatDate(point.x)
        const hour = `${String(point.y).padStart(2, '0')}:00`
        return `${date}, ${hour} — ${point.value.toFixed(0)}%`
      },
    },
    series: [{
      type: 'heatmap' as const,
      name: 'CFE Matching',
      data: data,
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
  }), [data])

  return (
    <div className="hourly-heatmap">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  )
}

export default HourlyHeatmap
