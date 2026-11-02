/**
 * Lightweight Highcharts wrapper that avoids the CJS interop issues
 * of `highcharts-react-official` with Vite 8 / Rolldown.
 *
 * Renders a container div and calls Highcharts.chart() imperatively.
 * Updates the chart when options change, destroys on unmount.
 */

import { useEffect, useRef } from 'react'
import Highcharts from 'highcharts'

// Register Highcharts modules via ESM side-effect imports.
// These paths are aliased by vite.config.ts to the ESM source builds.
import 'highcharts/highcharts-more'
import 'highcharts/modules/heatmap'
import 'highcharts/modules/sankey'
import 'highcharts/modules/pattern-fill'

export interface ChartProps {
  options: Highcharts.Options
}

export function Chart({ options }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<Highcharts.Chart | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    if (chartRef.current) {
      chartRef.current.update(options, true, true)
    } else {
      chartRef.current = Highcharts.chart(containerRef.current, options)
    }
  }, [options])

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [])

  return <div ref={containerRef} />
}
