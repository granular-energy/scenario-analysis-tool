/** Tiny shape preview (sparkline) for a profile's normalised hourly shape. */

import { useMemo } from 'react'

interface SparklineProps {
  shape: readonly number[]
  width?: number
  height?: number
  colour?: string
}

/**
 * Downsample a large array to `bins` representative values by averaging.
 * This lets us draw a 100-point SVG path from 8 760 hourly values.
 */
function downsample(data: readonly number[], bins: number): number[] {
  const step = data.length / bins
  const result: number[] = []
  for (let i = 0; i < bins; i++) {
    const start = Math.floor(i * step)
    const end = Math.floor((i + 1) * step)
    let sum = 0
    for (let j = start; j < end; j++) sum += data[j]
    result.push(sum / (end - start))
  }
  return result
}

export function Sparkline({ shape, width = 120, height = 32, colour }: SparklineProps) {
  const path = useMemo(() => {
    const points = downsample(shape, Math.min(100, shape.length))
    const max = Math.max(...points)
    if (max === 0) return ''
    const xStep = width / (points.length - 1)
    return points
      .map((v, i) => {
        const x = i * xStep
        const y = height - (v / max) * (height - 2) - 1
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  }, [shape, width, height])

  const lineColour = colour ?? 'var(--ge-teal)'

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="sparkline"
      aria-hidden="true"
    >
      <path d={path} fill="none" stroke={lineColour} strokeWidth="1.5" />
    </svg>
  )
}
