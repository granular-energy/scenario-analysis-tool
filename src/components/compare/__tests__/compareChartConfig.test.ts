import { describe, expect, it } from 'vitest'
import { buildCompareChartConfig } from '../compareChartConfig'

describe('buildCompareChartConfig', () => {
  const makeScenario = (name: string, scores: number[]) => ({
    name,
    monthlyScores: scores,
  })

  it('returns a config with one series per scenario', () => {
    const config = buildCompareChartConfig({
      scenarios: [
        makeScenario('Hourly', [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71]),
        makeScenario('Monthly', [75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86]),
      ],
    })

    expect(config.series).toHaveLength(2)
  })

  it('uses distinct series colours for each scenario', () => {
    const config = buildCompareChartConfig({
      scenarios: [
        makeScenario('A', Array(12).fill(50)),
        makeScenario('B', Array(12).fill(60)),
        makeScenario('C', Array(12).fill(70)),
      ],
    })

    const colours = (config.series as Array<{ color: string }>).map((s) => s.color)
    expect(colours[0]).toBe('#00988b')
    expect(colours[1]).toBe('#e9a23b')
    expect(colours[2]).toBe('#0f4974')
    // All different
    expect(new Set(colours).size).toBe(3)
  })

  it('sets y-axis range 0-100 for percentage scale', () => {
    const config = buildCompareChartConfig({
      scenarios: [makeScenario('A', Array(12).fill(50))],
    })

    const yAxis = config.yAxis as { min: number; max: number }
    expect(yAxis.min).toBe(0)
    expect(yAxis.max).toBe(100)
  })

  it('has 12 month categories on x-axis', () => {
    const config = buildCompareChartConfig({
      scenarios: [makeScenario('A', Array(12).fill(50))],
    })

    const xAxis = config.xAxis as { categories: string[] }
    expect(xAxis.categories).toHaveLength(12)
    expect(xAxis.categories[0]).toBe('Jan')
    expect(xAxis.categories[11]).toBe('Dec')
  })

  it('uses spline chart type', () => {
    const config = buildCompareChartConfig({
      scenarios: [makeScenario('A', Array(12).fill(50))],
    })

    expect(config.chart?.type).toBe('spline')
  })
})
