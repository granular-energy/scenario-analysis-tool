import { expect, test } from '@playwright/test'

test.describe('M4: PDF report generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')
  })

  test('Single scenario PDF download is triggered from Results tab', async ({ page }) => {
    // Navigate to Results tab (demo portfolio is pre-loaded)
    await page.click('[data-tab="results"]')

    // Verify the download report button is visible
    const downloadBtn = page.locator('[data-testid="download-report-btn"]')
    await expect(downloadBtn).toBeVisible()

    // Listen for download event
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 })
    await downloadBtn.click()
    const download = await downloadPromise

    // Verify the filename ends with -report.pdf
    expect(download.suggestedFilename()).toMatch(/-report\.pdf$/)
  })

  test('Comparison PDF download is triggered from Compare tab', async ({ page }) => {
    // Inject two scenarios with differing granularities
    await page.evaluate(() => {
      const makeScenario = (name: string, id: string, granularity: string) => ({
        id,
        name,
        savedAt: new Date().toISOString(),
        portfolio: {
          consumers: [
            {
              uid: 'c1',
              profileId: 'flat',
              name: 'Data centre',
              annualMWh: 50000,
              shape: Array(8760).fill(1 / 8760),
              source: 'library',
            },
          ],
          generators: [
            {
              uid: 'g1',
              profileId: 'solar',
              name: 'Solar PV',
              annualMWh: 24090,
              capacityFactor: 0.11,
              technology: 'solar',
              shape: Array(8760).fill(1 / 8760),
              source: 'library',
            },
          ],
          matrix: { g1: { c1: 100 } },
          granularity,
        },
        results: {
          hourlyScore: 67.33,
          annualScore: 100.74,
          totalExcessMWh: 364,
          totalUnmatchedMWh: 16335,
          monthlyScores: [60, 55, 65, 70, 75, 80, 78, 72, 68, 62, 58, 65],
        },
      })
      const scenarios = [
        makeScenario('Hourly scenario', 'id-h', 'hourly'),
        makeScenario('Monthly scenario', 'id-m', 'monthly'),
      ]
      localStorage.setItem('sat-v3-scenarios', JSON.stringify(scenarios))
    })

    await page.goto('/')
    await page.click('[data-tab="compare"]')

    // Select both scenarios
    const checkboxes = page.locator('.compare-picker__checkbox')
    await checkboxes.nth(0).check()
    await checkboxes.nth(1).check()

    // Verify comparison content renders
    await expect(page.locator('[data-testid="compare-columns"]')).toBeVisible()

    // Click download comparison PDF button
    const downloadBtn = page.locator('[data-testid="download-comparison-pdf"]')
    await expect(downloadBtn).toBeVisible()

    const downloadPromise = page.waitForEvent('download', { timeout: 10000 })
    await downloadBtn.click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toBe('scenario-comparison.pdf')
  })
})
