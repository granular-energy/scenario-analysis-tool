import { expect, test } from '@playwright/test'

test.describe('M4: Compare tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      localStorage.setItem('scenario-tool.signedUp', new Date().toISOString())
    })
    await page.goto('/')
  })

  test('M4.7 Compare tab shows guidance when fewer than 2 scenarios saved', async ({ page }) => {
    // With 0 saved scenarios, navigate to Compare
    await page.click('[data-tab="compare"]')
    const guidance = page.locator('[data-testid="compare-guidance"]')
    await expect(guidance).toBeVisible()
    await expect(guidance).toContainText('Save at least 2 scenarios')
  })

  test('M4.7 Compare tab shows picker when 2+ scenarios saved', async ({ page }) => {
    // Save two scenarios by injecting into localStorage
    await page.evaluate(() => {
      const demoScenario = (name: string, id: string) => ({
        id,
        name,
        savedAt: new Date().toISOString(),
        portfolio: {
          consumers: [
            {
              uid: 'c1',
              profileId: 'flat',
              name: 'Consumer A',
              annualMWh: 1000,
              shape: Array(8760).fill(1 / 8760),
              source: 'library',
            },
          ],
          generators: [
            {
              uid: 'g1',
              profileId: 'flat',
              name: 'Generator A',
              annualMWh: 1000,
              capacityFactor: 0.5,
              technology: 'solar',
              shape: Array(8760).fill(1 / 8760),
              source: 'library',
            },
          ],
          matrix: { g1: { c1: 100 } },
          granularity: 'hourly',
        },
        results: {
          hourlyScore: 100,
          annualScore: 100,
          totalExcessMWh: 0,
          totalUnmatchedMWh: 0,
          monthlyScores: Array(12).fill(100),
        },
      })
      const scenarios = [demoScenario('Scenario A', 'id-a'), demoScenario('Scenario B', 'id-b')]
      localStorage.setItem('sat-v3-scenarios', JSON.stringify(scenarios))
    })

    await page.goto('/')
    await page.click('[data-tab="compare"]')

    const picker = page.locator('[data-testid="compare-picker"]')
    await expect(picker).toBeVisible()
    await expect(picker).toContainText('Scenario A')
    await expect(picker).toContainText('Scenario B')
  })

  test('M4.9 Compare chart renders with 2 scenarios selected', async ({ page }) => {
    // Inject two scenarios
    await page.evaluate(() => {
      const makeScenario = (name: string, id: string, hourlyScore: number) => ({
        id,
        name,
        savedAt: new Date().toISOString(),
        portfolio: {
          consumers: [
            {
              uid: 'c1',
              profileId: 'flat',
              name: 'Consumer A',
              annualMWh: 1000,
              shape: Array(8760).fill(1 / 8760),
              source: 'library',
            },
          ],
          generators: [
            {
              uid: 'g1',
              profileId: 'flat',
              name: 'Generator A',
              annualMWh: 1000,
              capacityFactor: 0.5,
              technology: 'solar',
              shape: Array(8760).fill(1 / 8760),
              source: 'library',
            },
          ],
          matrix: { g1: { c1: 100 } },
          granularity: 'hourly',
        },
        results: {
          hourlyScore,
          annualScore: 100,
          totalExcessMWh: 0,
          totalUnmatchedMWh: 0,
          monthlyScores: Array(12).fill(hourlyScore),
        },
      })
      const scenarios = [makeScenario('Hourly', 'id-h', 67.33), makeScenario('Monthly', 'id-m', 85.5)]
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
    await expect(page.locator('[data-testid="compare-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="assumptions-table"]')).toBeVisible()
    await expect(page.locator('[data-testid="consumer-score-table"]')).toBeVisible()
  })

  test('M4.10 Assumptions table shows portfolio details', async ({ page }) => {
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
          totalExcessMWh: 0,
          totalUnmatchedMWh: 16335,
          monthlyScores: Array(12).fill(67),
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

    // Select both
    const checkboxes = page.locator('.compare-picker__checkbox')
    await checkboxes.nth(0).check()
    await checkboxes.nth(1).check()

    const table = page.locator('[data-testid="assumptions-table"]')
    await expect(table).toBeVisible()
    await expect(table).toContainText('Data centre')
    await expect(table).toContainText('50,000 MWh')
    await expect(table).toContainText('Allocation method')
  })

  test('M4.11 Differing cells are highlighted', async ({ page }) => {
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
          hourlyScore: 67,
          annualScore: 100,
          totalExcessMWh: 0,
          totalUnmatchedMWh: 16000,
          monthlyScores: Array(12).fill(67),
        },
      })
      const scenarios = [makeScenario('Hourly', 'id-h', 'hourly'), makeScenario('Monthly', 'id-m', 'monthly')]
      localStorage.setItem('sat-v3-scenarios', JSON.stringify(scenarios))
    })

    await page.goto('/')
    await page.click('[data-tab="compare"]')

    const checkboxes = page.locator('.compare-picker__checkbox')
    await checkboxes.nth(0).check()
    await checkboxes.nth(1).check()

    // The allocation method row should have highlighted cells
    const diffCells = page.locator('.assumptions-table__cell--differs')
    const count = await diffCells.count()
    expect(count).toBeGreaterThan(0)

    // The consumer row should NOT be highlighted (same consumers in both)
    // Check that the first row (Consumers) cells do not have --differs class
    const consumerCells = page.locator('tr:has(td:has-text("Consumers")) .assumptions-table__cell')
    for (let i = 0; i < (await consumerCells.count()); i++) {
      const cls = await consumerCells.nth(i).getAttribute('class')
      expect(cls).not.toContain('--differs')
    }
  })

  test('M4.16 Import scenario button is accessible on Compare tab', async ({ page }) => {
    await page.click('[data-tab="compare"]')
    const importBtn = page.locator('[data-testid="import-scenario-btn"]')
    await expect(importBtn).toBeVisible()
  })

  test('M4.17 At 375px viewport, columns stack vertically', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })

    await page.evaluate(() => {
      const makeScenario = (name: string, id: string) => ({
        id,
        name,
        savedAt: new Date().toISOString(),
        portfolio: {
          consumers: [
            {
              uid: 'c1',
              profileId: 'flat',
              name: 'Consumer',
              annualMWh: 1000,
              shape: Array(8760).fill(1 / 8760),
              source: 'library',
            },
          ],
          generators: [
            {
              uid: 'g1',
              profileId: 'flat',
              name: 'Generator',
              annualMWh: 1000,
              capacityFactor: 0.5,
              technology: 'solar',
              shape: Array(8760).fill(1 / 8760),
              source: 'library',
            },
          ],
          matrix: { g1: { c1: 100 } },
          granularity: 'hourly',
        },
        results: {
          hourlyScore: 100,
          annualScore: 100,
          totalExcessMWh: 0,
          totalUnmatchedMWh: 0,
          monthlyScores: Array(12).fill(100),
        },
      })
      const scenarios = [makeScenario('A', 'id-a'), makeScenario('B', 'id-b')]
      localStorage.setItem('sat-v3-scenarios', JSON.stringify(scenarios))
    })

    await page.goto('/')
    await page.click('[data-tab="compare"]')

    const checkboxes = page.locator('.compare-picker__checkbox')
    await checkboxes.nth(0).check()
    await checkboxes.nth(1).check()

    // Verify columns container is visible and stacked (single column layout)
    const columns = page.locator('[data-testid="compare-columns"]')
    await expect(columns).toBeVisible()

    // At 375px, columns should be in a single-column grid (stacked)
    const style = await columns.evaluate((el) => window.getComputedStyle(el).gridTemplateColumns)
    // Should resolve to a single column value at 375px
    const colCount = style.split(' ').filter((s) => s.trim().length > 0).length
    expect(colCount).toBe(1)
  })
})
