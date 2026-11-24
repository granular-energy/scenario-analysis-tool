import { expect, test } from '@playwright/test'

test.describe('M2: Portfolio and Allocation tabs', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage so each test gets the demo portfolio
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')
  })

  test('M2.1 Header has Granular wave logo and title in Space Grotesk', async ({ page }) => {
    const logo = page.locator('.app-header__logo')
    await expect(logo).toBeVisible()
    await expect(logo).toHaveAttribute('src', '/brand/granular-wave.svg')

    const title = page.locator('.app-header__title')
    await expect(title).toHaveText('Scenario Analysis Tool')
  })

  test('M2.2 Tab bar shows four tabs and switches content', async ({ page }) => {
    const tabs = page.locator('[role="tab"]')
    await expect(tabs).toHaveCount(4)

    // Click each tab and verify content
    await page.click('[data-tab="portfolio"]')
    await expect(page.locator('[data-testid="consumers-panel"]')).toBeVisible()

    await page.click('[data-tab="allocation"]')
    await expect(page.locator('[data-testid="allocation-matrix"]')).toBeVisible()

    await page.click('[data-tab="results"]')
    await expect(page.locator('[data-testid="results-tab"]')).toBeVisible()

    await page.click('[data-tab="compare"]')
    await expect(page.locator('[data-testid="compare-tab"]')).toBeVisible()
  })

  test('M2.3 CTA band links to granular-energy.com in new tab', async ({ page }) => {
    const link = page.locator('[data-testid="cta-link"]')
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', 'https://granular-energy.com')
    await expect(link).toHaveAttribute('target', '_blank')

    // Also visible on Allocation tab
    await page.click('[data-tab="allocation"]')
    await expect(link).toBeVisible()
  })

  test('M2.5 Portfolio tab has distinct Consumers and Generators panels', async ({ page }) => {
    await expect(page.locator('[data-testid="consumers-panel"]')).toBeVisible()
    await expect(page.locator('[data-testid="generators-panel"]')).toBeVisible()

    // Each has "Add from library" and "Upload CSV" actions
    await expect(page.locator('[data-testid="add-consumer-library"]')).toBeVisible()
    await expect(page.locator('[data-testid="add-consumer-upload"]')).toBeVisible()
    await expect(page.locator('[data-testid="add-generator-library"]')).toBeVisible()
    await expect(page.locator('[data-testid="add-generator-upload"]')).toBeVisible()
  })

  test('M2.6 Consumer library lists 9 profiles', async ({ page }) => {
    await page.click('[data-testid="add-consumer-library"]')
    const items = page.locator('[data-testid="library-list"] .library-list__item')
    await expect(items).toHaveCount(9)
    // Confirm "Data centre" is present
    await expect(items.filter({ hasText: 'Data centre' })).toHaveCount(1)
  })

  test('M2.7 Generator library lists 7 profiles', async ({ page }) => {
    await page.click('[data-testid="add-generator-library"]')
    const items = page.locator('[data-testid="library-list"] .library-list__item')
    await expect(items).toHaveCount(7)
    // Confirm "Solar PV temperate" is present
    await expect(items.filter({ hasText: 'Solar PV temperate' })).toHaveCount(1)
  })

  test('M2.8 Consumer sizing pre-filled, generator shows annual MWh and capacity hint', async ({ page }) => {
    // Demo portfolio already loaded: data centre at 50 000, solar at 24 090 MWh
    const consumerSizing = page.locator('[data-testid="consumer-sizing"]').first()
    await expect(consumerSizing).toHaveValue('50000')

    // Generator cards should show capacity hint (≈ MW at CF)
    const generatorHint = page.locator('[data-testid="generator-capacity-hint"]').first()
    await expect(generatorHint).toBeVisible()
    await expect(generatorHint).toContainText('MW')
    await expect(generatorHint).toContainText('capacity factor')
  })

  test('M2.9 Portfolio members show shape previews', async ({ page }) => {
    // Wait for the demo portfolio to load (profiles are lazy-loaded)
    await expect(page.locator('.member-card').first()).toBeVisible()
    // Check that sparkline SVGs are rendered
    const sparklines = page.locator('.sparkline')
    await expect(sparklines.first()).toBeVisible()
    const count = await sparklines.count()
    expect(count).toBeGreaterThanOrEqual(3) // 1 consumer + 2 generators in demo
  })

  test('M2.10 Removing a member updates the matrix and score strip', async ({ page }) => {
    // Add a second consumer
    await page.click('[data-testid="add-consumer-library"]')
    await page.click('[data-profile-id="office-temperate"]')

    // Now should have 2 consumers
    const consumerCards = page.locator('[data-testid="consumer-card"]')
    await expect(consumerCards).toHaveCount(2)

    // Switch to allocation to count matrix columns
    await page.click('[data-tab="allocation"]')
    const matrixHeaders = page.locator('.matrix-table__col-header')
    const countBefore = await matrixHeaders.count()

    // Go back and remove the second consumer
    await page.click('[data-tab="portfolio"]')
    const removeButtons = page.locator('[data-testid="consumer-card"] [data-testid="remove-member"]')
    await removeButtons.last().click()

    await expect(page.locator('[data-testid="consumer-card"]')).toHaveCount(1)

    // Matrix should have fewer columns
    await page.click('[data-tab="allocation"]')
    const matrixHeadersAfter = page.locator('.matrix-table__col-header')
    const countAfter = await matrixHeadersAfter.count()
    expect(countAfter).toBeLessThan(countBefore)
  })

  test('M2.11 Cannot add more than 5 consumers', async ({ page }) => {
    // Demo has 1 consumer; add 4 more
    for (let i = 0; i < 4; i++) {
      await page.click('[data-testid="add-consumer-library"]')
      const items = page.locator('[data-testid="library-list"] .library-list__item')
      await items.first().click()
    }

    await expect(page.locator('[data-testid="consumer-card"]')).toHaveCount(5)

    // The add button should now be disabled
    await expect(page.locator('[data-testid="add-consumer-library"]')).toBeDisabled()
  })

  test('M2.14 Allocation matrix has generators as rows and consumers as columns', async ({ page }) => {
    await page.click('[data-tab="allocation"]')
    const matrix = page.locator('[data-testid="allocation-matrix"]')
    await expect(matrix).toBeVisible()

    const rows = page.locator('[data-testid="matrix-row"]')
    await expect(rows).toHaveCount(2) // demo has 2 generators

    const cells = page.locator('[data-testid="matrix-cell"]')
    await expect(cells).toHaveCount(2) // 2 generators × 1 consumer
  })

  test('M2.15 Row total shows warning when exceeding 100%', async ({ page }) => {
    // Add a second consumer
    await page.click('[data-testid="add-consumer-library"]')
    await page.click('[data-profile-id="office-temperate"]')

    await page.click('[data-tab="allocation"]')

    // Fill first row: set both allocations to 60%
    const firstGen = page.locator('[data-testid="matrix-row"]').first()
    const inputs = firstGen.locator('[data-testid="matrix-cell"]')
    await inputs.first().fill('60')
    await inputs.last().fill('60')

    // The row total should show warning
    const total = firstGen.locator('[data-testid="row-total"]')
    await expect(total).toHaveClass(/matrix-table__total--warning/)
    await expect(total).toContainText('120')
  })

  test('M2.16 Allocate evenly fills equal shares', async ({ page }) => {
    // Add a second consumer
    await page.click('[data-testid="add-consumer-library"]')
    await page.click('[data-profile-id="office-temperate"]')

    await page.click('[data-tab="allocation"]')
    await page.click('[data-testid="allocate-evenly"]')

    // Each cell should be 50
    const inputs = page.locator('[data-testid="matrix-cell"]')
    const count = await inputs.count()
    for (let i = 0; i < count; i++) {
      await expect(inputs.nth(i)).toHaveValue('50')
    }
  })

  test('M2.17 Granularity selector has three options that update scores', async ({ page }) => {
    await page.click('[data-tab="allocation"]')
    const selector = page.locator('[data-testid="granularity-selector"]')
    await expect(selector).toBeVisible()

    // Get initial hourly score
    const hourlyScore = page.locator('[data-testid="hourly-score"]')
    const initialValue = await hourlyScore.textContent()

    // Switch to monthly
    await page.click('input[value="monthly"]')
    const monthlyValue = await hourlyScore.textContent()
    expect(monthlyValue).not.toBe(initialValue)

    // Switch to annual
    await page.click('input[value="annual"]')
    const annualValue = await hourlyScore.textContent()
    expect(annualValue).not.toBe(monthlyValue)
  })

  test('M2.19 State persists across page reload', async ({ page }) => {
    // Verify demo portfolio is loaded
    await expect(page.locator('[data-testid="consumer-card"]')).toHaveCount(1)

    // Add another consumer
    await page.click('[data-testid="add-consumer-library"]')
    await page.click('[data-profile-id="office-temperate"]')
    await expect(page.locator('[data-testid="consumer-card"]')).toHaveCount(2)

    // Reload and verify state persists
    await page.reload()
    await expect(page.locator('[data-testid="consumer-card"]')).toHaveCount(2)
  })

  test('M2.20 Demo portfolio loads on first visit', async ({ page }) => {
    // Already cleared localStorage in beforeEach
    // Check: 1 consumer (data centre), 2 generators (solar + wind)
    await expect(page.locator('[data-testid="consumer-card"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="generator-card"]')).toHaveCount(2)

    // Consumer is 50 000 MWh
    const consumerSizing = page.locator('[data-testid="consumer-sizing"]')
    await expect(consumerSizing).toHaveValue('50000')

    // Check allocation tab: each generator 100% to consumer
    await page.click('[data-tab="allocation"]')
    const inputs = page.locator('[data-testid="matrix-cell"]')
    await expect(inputs).toHaveCount(2)
    await expect(inputs.first()).toHaveValue('100')
    await expect(inputs.last()).toHaveValue('100')

    // Granularity should be hourly
    await expect(page.locator('input[value="hourly"]')).toBeChecked()
  })

  test('M2.21 Score strip shows portfolio totals on every tab, scores only on Allocation', async ({
    page,
  }) => {
    const strip = page.locator('[data-testid="score-strip"]')
    await expect(strip).toBeVisible()
    await expect(strip).toContainText('Whole portfolio')
    await expect(page.locator('[data-testid="total-consumption"]')).toContainText('50,000')
    await expect(page.locator('[data-testid="total-generation"]')).toContainText('50,370')
    await expect(page.locator('[data-testid="hourly-score"]')).toHaveCount(0)

    await page.click('[data-tab="allocation"]')
    await expect(strip).toBeVisible()
    await expect(page.locator('[data-testid="hourly-score"]')).toBeVisible()

    // Results has its own tiles, so the strip drops the scores there
    await page.click('[data-tab="results"]')
    await expect(strip).toBeVisible()
    await expect(page.locator('[data-testid="hourly-score"]')).toHaveCount(0)
  })

  test('M2.22 Demo portfolio shows correct hourly and annual scores', async ({ page }) => {
    await page.click('[data-tab="allocation"]')
    const hourlyScore = page.locator('[data-testid="hourly-score"]')
    const annualScore = page.locator('[data-testid="annual-score"]')

    // Hourly 67.33 % (golden fixture); annual is volumetric: 50,370 ÷ 50,000
    const hourlyText = await hourlyScore.textContent()
    const annualText = await annualScore.textContent()

    const hourlyNum = parseFloat(hourlyText!.replace(/[^0-9.]/g, ''))
    const annualNum = parseFloat(annualText!.replace(/[^0-9.]/g, ''))

    expect(Math.abs(hourlyNum - 67.33)).toBeLessThan(0.01)
    expect(Math.abs(annualNum - 100.74)).toBeLessThan(0.01)
  })
})
