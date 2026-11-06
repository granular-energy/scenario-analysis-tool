import { expect, test } from '@playwright/test'

test.describe('M3: Results tab', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage so each test gets the demo portfolio
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')
    // Navigate to Results tab
    await page.click('[data-tab="results"]')
  })

  test('M3.1 Granularity description updates when changed', async ({ page }) => {
    const granularity = page.locator('[data-testid="results-granularity"]')
    await expect(granularity).toContainText('Hourly matching only')

    // Switch to monthly on Allocation tab
    await page.click('[data-tab="allocation"]')
    await page.click('input[value="monthly"]')

    // Return to Results and check text changed
    await page.click('[data-tab="results"]')
    await expect(granularity).toContainText('Monthly matching target')
  })

  test('M3.2 Consumer selector shows Whole portfolio and Data centre', async ({ page }) => {
    const selector = page.locator('[data-testid="consumer-selector"]')
    await expect(selector).toBeVisible()

    // Check options
    const options = selector.locator('option')
    await expect(options).toHaveCount(2)
    await expect(options.nth(0)).toHaveText('Whole portfolio')
    await expect(options.nth(1)).toHaveText('Data centre')

    // Default should be Whole portfolio
    await expect(selector).toHaveValue('__portfolio__')
  })

  test('M3.3 Hourly matching score tile shows ~67.33%', async ({ page }) => {
    const tile = page.locator('[data-testid="tile-hourly-score"]')
    await expect(tile).toBeVisible()

    const valueEl = tile.locator('.score-tile__value')
    const text = await valueEl.textContent()
    const num = parseFloat(text!.replace(/[^0-9.]/g, ''))
    expect(Math.abs(num - 67.33)).toBeLessThan(0.01)

    // Should use teal accent
    await expect(valueEl).toHaveClass(/score-tile__value--accent/)
  })

  test('M3.4 Annual (volumetric) score tile shows ~100.74% in header tiles area', async ({ page }) => {
    const tile = page.locator('[data-testid="tile-annual-score"]')
    await expect(tile).toBeVisible()

    // Check it's inside the tiles container, not in a chart section
    const tilesArea = page.locator('[data-testid="results-tiles"]')
    await expect(tilesArea.locator('[data-testid="tile-annual-score"]')).toBeVisible()

    // Volumetric: 50,370 MWh generation ÷ 50,000 MWh demand, regardless of matching method
    const text = await tile.locator('.score-tile__value').textContent()
    const num = parseFloat(text!.replace(/[^0-9.]/g, ''))
    expect(Math.abs(num - 100.74)).toBeLessThan(0.01)

    // Label should mention Annual or volumetric
    await expect(tile.locator('.score-tile__label')).toContainText('Annual')
  })

  test('M3.5 Excess tile shows 0 MWh at hourly granularity', async ({ page }) => {
    const tile = page.locator('[data-testid="tile-excess"]')
    await expect(tile).toBeVisible()

    const text = await tile.locator('.score-tile__value').textContent()
    expect(text).toContain('0')
  })

  test('M3.6 Unmatched demand tile shows approximately 16335 MWh', async ({ page }) => {
    const tile = page.locator('[data-testid="tile-unmatched"]')
    await expect(tile).toBeVisible()

    const text = await tile.locator('.score-tile__value').textContent()
    const num = parseFloat(text!.replace(/[^0-9.]/g, ''))
    // unmatched = 50000 * (1 - 67.33/100) ≈ 16335
    expect(num).toBeGreaterThan(16000)
    expect(num).toBeLessThan(17000)
  })

  test('M3.7 Each tile has a tooltip with explanation', async ({ page }) => {
    const tileIds = ['tile-hourly-score', 'tile-annual-score', 'tile-excess', 'tile-unmatched']
    for (const id of tileIds) {
      const tile = page.locator(`[data-testid="${id}"]`)
      const infoBtn = tile.locator('.score-tile__info')
      await expect(infoBtn).toBeVisible()

      // Hover to show tooltip
      await infoBtn.hover()
      const tooltip = tile.locator('[role="tooltip"]')
      await expect(tooltip).toBeVisible()

      // Tooltip should have content
      const tooltipText = await tooltip.textContent()
      expect(tooltipText!.length).toBeGreaterThan(10)
    }
  })

  test('M3.8 Chart 1 — Average 24-hour profile is rendered', async ({ page }) => {
    const chart = page.locator('[data-testid="chart-average-day"]')
    await expect(chart).toBeVisible()

    // Should contain a Highcharts container
    await expect(chart.locator('.highcharts-container')).toBeVisible()
  })

  test('M3.9 Chart 2 — Hourly matching heatmap is rendered', async ({ page }) => {
    const chart = page.locator('[data-testid="chart-heatmap"]')
    await expect(chart).toBeVisible()
    await expect(chart.locator('.highcharts-container')).toBeVisible()
  })

  test('M3.10 Chart 3 — Monthly breakdown is rendered', async ({ page }) => {
    const chart = page.locator('[data-testid="chart-monthly"]')
    await expect(chart).toBeVisible()
    await expect(chart.locator('.highcharts-container')).toBeVisible()
  })

  test('M3.11 Chart 4 — Example day defaults to 1 May and updates', async ({ page }) => {
    const chart = page.locator('[data-testid="chart-example-day"]')
    await expect(chart).toBeVisible()
    await expect(chart.locator('.highcharts-container')).toBeVisible()

    // Check default date (day index 120 = 1 May)
    const picker = page.locator('[data-testid="day-picker"]')
    await expect(picker).toHaveValue('120')

    // The chart title should show day and month only, no year
    const title = chart.locator('.results-tab__chart-title')
    await expect(title).toContainText('1 May')
    const titleText = await title.textContent()
    expect(titleText).not.toMatch(/\d{4}/)

    // Change day and verify chart updates
    await picker.selectOption({ label: '15 August' })
    await expect(chart.locator('.highcharts-container')).toBeVisible()
  })

  test('M3.12 Chart 5 — Sankey diagram is rendered', async ({ page }) => {
    const chart = page.locator('[data-testid="chart-sankey"]')
    await expect(chart).toBeVisible()
    await expect(chart.locator('.highcharts-container')).toBeVisible()
  })

  test('M3.13 Selecting a specific consumer updates tiles and charts', async ({ page }) => {
    const selector = page.locator('[data-testid="consumer-selector"]')

    // Read portfolio values
    const hourlyTile = page.locator('[data-testid="tile-hourly-score"] .score-tile__value')
    const portfolioScore = await hourlyTile.textContent()

    // Select Data centre
    await selector.selectOption('demo-dc')

    // With demo's single consumer, values match portfolio
    const consumerScore = await hourlyTile.textContent()
    expect(consumerScore).toBe(portfolioScore)

    // Charts should still be visible
    await expect(page.locator('[data-testid="chart-average-day"] .highcharts-container')).toBeVisible()
    await expect(page.locator('[data-testid="chart-sankey"] .highcharts-container')).toBeVisible()
  })

  test('M3.14 Two consumers with different allocations show different scores', async ({ page }) => {
    // Go to Portfolio tab and add a second consumer
    await page.click('[data-tab="portfolio"]')
    await page.click('[data-testid="add-consumer-library"]')
    await page.click('[data-profile-id="office-temperate"]')

    // Go to Allocation tab and set different allocations
    await page.click('[data-tab="allocation"]')
    const cells = page.locator('[data-testid="matrix-cell"]')
    // Solar: 80% to Data centre, 20% to Office
    await cells.nth(0).fill('80')
    await cells.nth(1).fill('20')
    // Wind: 30% to Data centre, 70% to Office
    await cells.nth(2).fill('30')
    await cells.nth(3).fill('70')

    // Navigate to Results
    await page.click('[data-tab="results"]')

    const selector = page.locator('[data-testid="consumer-selector"]')
    const hourlyTile = page.locator('[data-testid="tile-hourly-score"] .score-tile__value')

    // Select first consumer
    await selector.selectOption({ index: 1 })
    const score1Text = await hourlyTile.textContent()
    const score1 = parseFloat(score1Text!.replace(/[^0-9.]/g, ''))

    // Select second consumer
    await selector.selectOption({ index: 2 })
    const score2Text = await hourlyTile.textContent()
    const score2 = parseFloat(score2Text!.replace(/[^0-9.]/g, ''))

    // Scores should differ because allocations are different
    expect(score1).not.toBe(score2)
    // Both should be valid percentages
    expect(score1).toBeGreaterThan(0)
    expect(score1).toBeLessThan(100)
    expect(score2).toBeGreaterThan(0)
    expect(score2).toBeLessThan(100)
  })

  test('M3.16 Empty state when no allocations', async ({ page }) => {
    // Go to Allocation tab and set all cells to 0
    await page.click('[data-tab="allocation"]')
    const cells = page.locator('[data-testid="matrix-cell"]')
    const count = await cells.count()
    for (let i = 0; i < count; i++) {
      await cells.nth(i).fill('0')
    }

    // Navigate to Results
    await page.click('[data-tab="results"]')

    // Should show empty state
    await expect(page.locator('[data-testid="results-empty"]')).toBeVisible()

    // No charts or tiles should be visible
    await expect(page.locator('[data-testid="results-tiles"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="chart-average-day"]')).not.toBeVisible()
  })

  test('M3.20 Results tab replaces the placeholder text', async ({ page }) => {
    // The old placeholder should not be present
    await expect(page.locator('[data-testid="results-placeholder"]')).not.toBeVisible()

    // The full results tab should be visible
    await expect(page.locator('[data-testid="results-tab"]')).toBeVisible()
  })
})
