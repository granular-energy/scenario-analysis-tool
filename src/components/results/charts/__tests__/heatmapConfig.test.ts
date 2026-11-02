import { describe, expect, it } from 'vitest'
import { buildHeatmapMatrix, matrixToHeatmapData } from '../heatmapConfig'

describe('buildHeatmapMatrix', () => {
  it('returns a 12x24 matrix', () => {
    const hourlyMatchPct = new Array(8760).fill(50)
    const matrix = buildHeatmapMatrix(hourlyMatchPct)
    expect(matrix).toHaveLength(12)
    for (const row of matrix) {
      expect(row).toHaveLength(24)
    }
  })

  it('averages values correctly for uniform input', () => {
    const hourlyMatchPct = new Array(8760).fill(75)
    const matrix = buildHeatmapMatrix(hourlyMatchPct)
    for (let m = 0; m < 12; m++) {
      for (let h = 0; h < 24; h++) {
        expect(matrix[m][h]).toBeCloseTo(75, 6)
      }
    }
  })

  it('gives higher values for midday summer hours with solar-like data', () => {
    // Simulate solar: high match at midday (hours 10-14) in summer (months 4-8)
    const hourlyMatchPct = new Array(8760).fill(0)
    const MONTH_STARTS = [0, 744, 1416, 2160, 2880, 3624, 4344, 5088, 5832, 6552, 7296, 8016]
    const MONTH_ENDS = [744, 1416, 2160, 2880, 3624, 4344, 5088, 5832, 6552, 7296, 8016, 8760]

    for (let m = 0; m < 12; m++) {
      for (let h = MONTH_STARTS[m]; h < MONTH_ENDS[m]; h++) {
        const hod = h % 24
        if (m >= 4 && m <= 8 && hod >= 10 && hod <= 14) {
          hourlyMatchPct[h] = 90
        } else {
          hourlyMatchPct[h] = 10
        }
      }
    }

    const matrix = buildHeatmapMatrix(hourlyMatchPct)

    // June (index 5) at noon (index 12) should be ~90
    expect(matrix[5][12]).toBeCloseTo(90, 1)
    // January (index 0) at midnight (index 0) should be ~10
    expect(matrix[0][0]).toBeCloseTo(10, 1)
  })
})

describe('matrixToHeatmapData', () => {
  it('produces 12×24 = 288 data points', () => {
    const matrix = Array.from({ length: 12 }, () => new Array(24).fill(50))
    const data = matrixToHeatmapData(matrix)
    expect(data).toHaveLength(288)
  })

  it('data points have correct [x, y, value] structure', () => {
    const matrix = Array.from({ length: 12 }, (_, m) => Array.from({ length: 24 }, (_, h) => m * 24 + h))
    const data = matrixToHeatmapData(matrix)
    // First point: [0, 0, 0]
    expect(data[0]).toEqual([0, 0, 0])
    // Point for month 1, hour 2: [2, 1, 26]
    expect(data[1 * 24 + 2]).toEqual([2, 1, 26])
  })
})
