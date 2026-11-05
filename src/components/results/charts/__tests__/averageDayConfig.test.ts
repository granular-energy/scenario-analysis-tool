import { describe, expect, it } from 'vitest'
import { averageByHour, buildAverageDayConfig, type AverageDayInput } from '../averageDayConfig'

describe('averageByHour', () => {
  it('averages each hour-of-day slot across 365 days', () => {
    // Create a simple series: each hour has value = hourOfDay (0..23), constant across days
    const series = new Array(8760).fill(0).map((_, i) => i % 24)
    const result = averageByHour(series)
    expect(result).toHaveLength(24)
    // Each hour's average should equal the hour index itself
    for (let h = 0; h < 24; h++) {
      expect(result[h]).toBeCloseTo(h, 6)
    }
  })

  it('handles varying daily values', () => {
    // Day 0: all ones, Day 1: all twos, etc.
    const series = new Array(8760).fill(0).map((_, i) => Math.floor(i / 24) + 1)
    const result = averageByHour(series)
    // Average of 1..365 = 183
    const expectedAvg = (365 * 366) / 2 / 365
    for (let h = 0; h < 24; h++) {
      expect(result[h]).toBeCloseTo(expectedAvg, 6)
    }
  })
})

describe('buildAverageDayConfig', () => {
  it('returns valid Highcharts options with correct series count', () => {
    const input: AverageDayInput = {
      demandMWh: new Array(8760).fill(10),
      unmatchedMWh: new Array(8760).fill(3),
      generators: [
        {
          name: 'Solar',
          technology: 'solar',
          matchedMWh: new Array(8760).fill(7),
          excessMWh: new Array(8760).fill(0),
        },
      ],
    }
    const config = buildAverageDayConfig(input)

    // Should have 3 series: 1 matched generator + 1 unmatched + 1 demand
    // (excess is omitted because total is below threshold)
    expect(config.series).toHaveLength(3)

    // X-axis categories should be 24 hours
    const xAxis = config.xAxis as { categories?: string[] }
    expect(xAxis.categories).toHaveLength(24)
    expect(xAxis.categories![0]).toBe('00')
    expect(xAxis.categories![23]).toBe('23')
  })

  it('uses solar technology colour for solar generator', () => {
    const input: AverageDayInput = {
      demandMWh: new Array(8760).fill(10),
      unmatchedMWh: new Array(8760).fill(5),
      generators: [
        {
          name: 'Solar PV',
          technology: 'solar',
          matchedMWh: new Array(8760).fill(5),
          excessMWh: new Array(8760).fill(0),
        },
      ],
    }
    const config = buildAverageDayConfig(input)
    const series = config.series as Array<{ color?: string; name?: string }>
    const solarSeries = series.find((s) => s.name === 'Solar PV')
    expect(solarSeries?.color).toBe('#FDCF77')
  })

  it('includes excess series when total exceeds threshold', () => {
    const input: AverageDayInput = {
      demandMWh: new Array(8760).fill(10),
      unmatchedMWh: new Array(8760).fill(0),
      generators: [
        {
          name: 'Solar PV',
          technology: 'solar',
          matchedMWh: new Array(8760).fill(8),
          excessMWh: new Array(8760).fill(2),
        },
      ],
    }
    const config = buildAverageDayConfig(input)
    const series = config.series as Array<{ name?: string; color?: string }>
    const excessSeries = series.find((s) => s.name === 'Solar PV in excess')
    expect(excessSeries).toBeDefined()
    // Excess colour for solar is pastel
    expect(excessSeries?.color).toBe('#FEE0A7')
  })

  it('omits excess series when total is below threshold', () => {
    const input: AverageDayInput = {
      demandMWh: new Array(8760).fill(10),
      unmatchedMWh: new Array(8760).fill(3),
      generators: [
        {
          name: 'Solar PV',
          technology: 'solar',
          matchedMWh: new Array(8760).fill(7),
          excessMWh: new Array(8760).fill(0),
        },
      ],
    }
    const config = buildAverageDayConfig(input)
    const series = config.series as Array<{ name?: string }>
    const excessSeries = series.find((s) => s.name === 'Solar PV in excess')
    expect(excessSeries).toBeUndefined()
  })
})
