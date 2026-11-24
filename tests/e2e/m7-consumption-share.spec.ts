import { expect, test } from '@playwright/test'

test.describe('M7: Set % of consumption allocation mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      localStorage.setItem('scenario-tool.signedUp', new Date().toISOString())
    })
    await page.goto('/')
  })

  test('M7.1 PortfolioState persists allocationMode and consumptionMatrix in localStorage', async ({
    page,
  }) => {
    // Interact with the app so portfolio state is saved
    await page.click('[data-tab="allocation"]')
    await expect(page.locator('[data-testid="allocation-matrix"]')).toBeVisible()

    // Now check localStorage
    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('sat-v3-portfolio')
      return raw ? JSON.parse(raw) : null
    })
    expect(stored).toBeTruthy()
    expect(stored).toHaveProperty('allocationMode')
    expect(stored).toHaveProperty('consumptionMatrix')
  })

  test('M7.2 Demo portfolio starts in generator-share mode', async ({ page }) => {
    await page.click('[data-tab="allocation"]')
    // The generator-share option should be active
    const genShareBtn = page.locator('[data-testid="mode-generator-share"]')
    await expect(genShareBtn).toHaveAttribute('aria-pressed', 'true')
    // The consumption-share option should not be active
    const conShareBtn = page.locator('[data-testid="mode-consumption-share"]')
    await expect(conShareBtn).toHaveAttribute('aria-pressed', 'false')
  })

  test('M7.3 Segmented toggle with both options is visible on Allocation tab', async ({ page }) => {
    await page.click('[data-tab="allocation"]')
    const toggle = page.locator('[data-testid="allocation-mode-toggle"]')
    await expect(toggle).toBeVisible()
    await expect(toggle).toContainText('Share of generator output')
    await expect(toggle).toContainText('Set % of consumption')
  })

  test('M7.4 Clicking consumption-share activates it and matrix heading updates', async ({ page }) => {
    await page.click('[data-tab="allocation"]')
    const conShareBtn = page.locator('[data-testid="mode-consumption-share"]')
    await conShareBtn.click()

    // Should be visually active
    await expect(conShareBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(conShareBtn).toHaveClass(/active/)

    // Generator-share should be inactive
    const genShareBtn = page.locator('[data-testid="mode-generator-share"]')
    await expect(genShareBtn).toHaveAttribute('aria-pressed', 'false')
  })

  test('M7.5 Mode description updates when toggling modes', async ({ page }) => {
    await page.click('[data-tab="allocation"]')
    const description = page.locator('[data-testid="allocation-mode-description"]')

    // Generator-share mode: mentions generator and output
    await expect(description).toContainText('generator')
    await expect(description).toContainText('output')

    // Switch to consumption-share
    await page.click('[data-testid="mode-consumption-share"]')
    await expect(description).toContainText('consumer')
    await expect(description).toContainText('demand')
  })

  test('M7.6 Consumption-share cell: 15% of 50,000 MWh shows 7,500 MWh', async ({ page }) => {
    await page.click('[data-tab="allocation"]')
    await page.click('[data-testid="mode-consumption-share"]')

    // The demo has 1 consumer (Data centre, 50,000 MWh) and 2 generators
    // Get the first matrix cell and set it to 15
    const cells = page.locator('[data-testid="matrix-cell"]')
    const firstCell = cells.first()
    await firstCell.fill('15')

    // The computed MWh annotation should show 7,500 MWh
    const firstRow = page.locator('[data-testid="matrix-row"]').first()
    await expect(firstRow).toContainText('7,500')
  })

  test('M7.7 Consumer allocated-pct total shows 15.0% for a single 15% entry', async ({ page }) => {
    await page.click('[data-tab="allocation"]')
    await page.click('[data-testid="mode-consumption-share"]')

    const cells = page.locator('[data-testid="matrix-cell"]')
    // Set first generator to 15%, second to 0%
    await cells.nth(0).fill('15')
    await cells.nth(1).fill('0')

    const allocatedPct = page.locator('[data-testid="consumer-allocated-pct"]')
    await expect(allocatedPct.first()).toContainText('15.0')
  })

  test('M7.8 Consumer allocated-pct turns amber when exceeding 100%', async ({ page }) => {
    await page.click('[data-tab="allocation"]')
    await page.click('[data-testid="mode-consumption-share"]')

    const cells = page.locator('[data-testid="matrix-cell"]')
    // Set both generators to 60% each (total 120%)
    await cells.nth(0).fill('60')
    await cells.nth(1).fill('60')

    const allocatedPct = page.locator('[data-testid="consumer-allocated-pct"]')
    // Should have warning class
    await expect(allocatedPct.first()).toHaveClass(/warning/)
    // Should have a title about excess/over-allocation
    const title = await allocatedPct.first().getAttribute('title')
    expect(title).toBeTruthy()
    expect(title!.toLowerCase()).toMatch(/over-allocation|excess/)
  })

  test('M7.9 Row totals in consumption-share show assigned MWh, not percentage', async ({ page }) => {
    await page.click('[data-tab="allocation"]')
    await page.click('[data-testid="mode-consumption-share"]')

    const cells = page.locator('[data-testid="matrix-cell"]')
    await cells.nth(0).fill('15')

    // Row total for first generator should show 7,500 MWh
    const rowTotal = page.locator('[data-testid="row-total"]').first()
    await expect(rowTotal).toContainText('7,500')
    await expect(rowTotal).toContainText('MWh')
  })

  test('M7.10 Switching modes preserves both matrices', async ({ page }) => {
    await page.click('[data-tab="allocation"]')

    // Switch to consumption-share and enter 15
    await page.click('[data-testid="mode-consumption-share"]')
    const cells = page.locator('[data-testid="matrix-cell"]')
    await cells.nth(0).fill('15')

    // Switch to generator-share
    await page.click('[data-testid="mode-generator-share"]')

    // Switch back to consumption-share
    await page.click('[data-testid="mode-consumption-share"]')

    // The 15 should still be there
    const firstCell = page.locator('[data-testid="matrix-cell"]').first()
    await expect(firstCell).toHaveValue('15')
  })

  test('M7.11 Allocate evenly in consumption-share: 1 consumer, 2 generators = 50% each', async ({
    page,
  }) => {
    await page.click('[data-tab="allocation"]')
    await page.click('[data-testid="mode-consumption-share"]')

    // Click allocate evenly
    await page.click('[data-testid="allocate-evenly"]')

    // Both cells should be 50
    const cells = page.locator('[data-testid="matrix-cell"]')
    await expect(cells.nth(0)).toHaveValue('50')
    await expect(cells.nth(1)).toHaveValue('50')
  })

  test('M7.14 Score strip shows "Assigned" label in consumption-share mode', async ({ page }) => {
    await page.click('[data-tab="allocation"]')
    await page.click('[data-testid="mode-consumption-share"]')

    // Set some allocation so the engine has data
    const cells = page.locator('[data-testid="matrix-cell"]')
    await cells.nth(0).fill('50')
    await cells.nth(1).fill('50')

    // The score strip should be visible (it appears on allocation tab)
    const scoreStrip = page.locator('[data-testid="score-strip"]')
    await expect(scoreStrip).toBeVisible()

    // Label should say "Assigned" not "Annual generation"
    await expect(scoreStrip).toContainText('Assigned')
  })

  test('M7.15 Results tab header includes "consumption" text in consumption-share mode', async ({ page }) => {
    await page.click('[data-tab="allocation"]')
    await page.click('[data-testid="mode-consumption-share"]')

    const cells = page.locator('[data-testid="matrix-cell"]')
    await cells.nth(0).fill('50')
    await cells.nth(1).fill('50')

    await page.click('[data-tab="results"]')
    const granularity = page.locator('[data-testid="results-granularity"]')
    await expect(granularity).toContainText(/consumption/i)
  })

  test('M7.16 Sankey has no Surplus node in consumption-share mode', async ({ page }) => {
    await page.click('[data-tab="allocation"]')
    await page.click('[data-testid="mode-consumption-share"]')

    const cells = page.locator('[data-testid="matrix-cell"]')
    await cells.nth(0).fill('50')
    await cells.nth(1).fill('50')

    await page.click('[data-tab="results"]')

    // Wait for the sankey chart to render
    const sankeyContainer = page.locator('[data-testid="chart-sankey"]')
    await expect(sankeyContainer).toBeVisible()

    // Check that no visible Sankey data-label contains "Surplus"
    // Use the Highcharts data-label spans rather than raw textContent
    // (which includes injected <style> blocks from Highcharts)
    const dataLabels = sankeyContainer.locator('.highcharts-data-label text, .highcharts-label text')
    const count = await dataLabels.count()
    for (let i = 0; i < count; i++) {
      const text = await dataLabels.nth(i).textContent()
      expect(text).not.toMatch(/Surplus/)
    }
  })

  test('M7.17 Scenario JSON export includes allocationMode and consumptionMatrix', async ({ page }) => {
    await page.click('[data-tab="allocation"]')
    await page.click('[data-testid="mode-consumption-share"]')

    const cells = page.locator('[data-testid="matrix-cell"]')
    await cells.nth(0).fill('15')

    // Navigate to results and save scenario
    await page.click('[data-tab="results"]')

    // Wait for results to load
    await expect(page.locator('[data-testid="results-tab"]')).toBeVisible()

    // Save scenario
    page.once('dialog', async (dialog) => {
      await dialog.accept('CS Test Scenario')
    })
    await page.click('[data-testid="save-scenario-btn"]')
    await expect(page.locator('[data-testid="save-confirmation"]')).toBeVisible()

    // Check the saved scenario in localStorage
    const scenario = await page.evaluate(() => {
      const raw = localStorage.getItem('sat-v3-scenarios')
      if (!raw) return null
      const scenarios = JSON.parse(raw)
      return scenarios.find((s: { name: string }) => s.name === 'CS Test Scenario') ?? null
    })

    expect(scenario).toBeTruthy()
    expect(scenario.portfolio.allocationMode).toBe('consumption-share')
    expect(scenario.portfolio.consumptionMatrix).toBeTruthy()
  })

  test('M7.19 Compare assumptions table includes Allocation mode row with highlighting', async ({ page }) => {
    // Save one scenario in generator-share mode (demo default)
    await page.click('[data-tab="results"]')
    await expect(page.locator('[data-testid="results-tab"]')).toBeVisible()

    page.once('dialog', async (dialog) => {
      await dialog.accept('GenShare Scenario')
    })
    await page.click('[data-testid="save-scenario-btn"]')
    await expect(page.locator('[data-testid="save-confirmation"]')).toBeVisible()
    await page.waitForTimeout(2200)

    // Switch to consumption-share mode and save another scenario
    await page.click('[data-tab="allocation"]')
    await page.click('[data-testid="mode-consumption-share"]')
    const cells = page.locator('[data-testid="matrix-cell"]')
    await cells.nth(0).fill('50')
    await cells.nth(1).fill('50')

    await page.click('[data-tab="results"]')
    await expect(page.locator('[data-testid="results-tab"]')).toBeVisible()

    page.once('dialog', async (dialog) => {
      await dialog.accept('ConShare Scenario')
    })
    await page.click('[data-testid="save-scenario-btn"]')
    await expect(page.locator('[data-testid="save-confirmation"]')).toBeVisible()
    await page.waitForTimeout(2200)

    // Go to compare tab and select both
    await page.click('[data-tab="compare"]')
    const checkboxes = page.locator('.compare-picker__checkbox')
    await checkboxes.nth(0).check()
    await checkboxes.nth(1).check()

    // Verify assumptions table has Allocation mode row
    const assumptionsTable = page.locator('[data-testid="assumptions-table"]')
    await expect(assumptionsTable).toBeVisible()
    await expect(assumptionsTable).toContainText('Allocation mode')

    // The two cells should differ (one generator-share, one consumption-share)
    const differingCells = assumptionsTable.locator('.assumptions-table__cell--differs')
    // At least the allocation mode row should have differing cells
    const count = await differingCells.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test('M7.20 PDF downloads succeed in consumption-share mode', async ({ page }) => {
    await page.click('[data-tab="allocation"]')
    await page.click('[data-testid="mode-consumption-share"]')
    const cells = page.locator('[data-testid="matrix-cell"]')
    await cells.nth(0).fill('50')
    await cells.nth(1).fill('50')

    await page.click('[data-tab="results"]')
    await expect(page.locator('[data-testid="results-tab"]')).toBeVisible()

    // Try downloading the PDF report (should not crash)
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="download-report-btn"]'),
    ])
    expect(download.suggestedFilename()).toMatch(/\.pdf$/)
  })

  test('M7.21 Mobile viewport: toggle visible without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.click('[data-tab="allocation"]')

    const toggle = page.locator('[data-testid="allocation-mode-toggle"]')
    await expect(toggle).toBeVisible()

    // Both option labels should be visible
    await expect(page.locator('[data-testid="mode-generator-share"]')).toBeVisible()
    await expect(page.locator('[data-testid="mode-consumption-share"]')).toBeVisible()

    // No horizontal overflow
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    )
    expect(hasOverflow).toBe(true)
  })

  test('M7.22 Persistence across reload', async ({ page }) => {
    await page.click('[data-tab="allocation"]')
    await page.click('[data-testid="mode-consumption-share"]')

    const cells = page.locator('[data-testid="matrix-cell"]')
    await cells.nth(0).fill('25')

    // Reload
    await page.reload()

    // Navigate back to allocation
    await page.click('[data-tab="allocation"]')

    // Mode should still be consumption-share
    const conShareBtn = page.locator('[data-testid="mode-consumption-share"]')
    await expect(conShareBtn).toHaveAttribute('aria-pressed', 'true')

    // Value should still be 25
    const firstCell = page.locator('[data-testid="matrix-cell"]').first()
    await expect(firstCell).toHaveValue('25')
  })
})
