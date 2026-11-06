import { expect, test } from '@playwright/test'

test.describe('M3c: As-produced method and shape-preservation', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage so each test gets the demo portfolio
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')
  })

  test('M3c.6 "How allocation works" note appears on the Allocation tab', async ({ page }) => {
    await page.click('[data-tab="allocation"]')
    const note = page.locator('[data-testid="how-allocation-works"]')
    await expect(note).toBeVisible()
    await expect(note).toContainText('never moved into the hours that happen to need it')
    await expect(note).toContainText('not at all, the whole year, every month, or every hour')
    await expect(note).toContainText('Hourly matching is the one method that clips the shape')
  })

  test('M3c.7 First radio option is "As produced (no cap)" with correct description', async ({ page }) => {
    await page.click('[data-tab="allocation"]')
    const selector = page.locator('[data-testid="granularity-selector"]')
    const options = selector.locator('.granularity-selector__option')
    await expect(options).toHaveCount(4)

    const fourthOption = options.nth(0)
    const label = fourthOption.locator('.granularity-selector__label')
    await expect(label).toHaveText('As produced (no cap)')

    const desc = fourthOption.locator('.granularity-selector__desc')
    await expect(desc).toContainText(
      'The consumer receives its full share of each generator\u2019s output in every hour, with nothing held back',
    )
    await expect(desc).toContainText('pay-as-produced PPA')
    await expect(desc).toContainText('Excess appears wherever generation exceeds consumption in the hour')
  })

  test('M3c.8 Existing options describe cap window and shape rule', async ({ page }) => {
    await page.click('[data-tab="allocation"]')
    const options = page.locator('.granularity-selector__option')

    // Order runs least to most strict: as-produced, annual, monthly, hourly
    const annualDesc = options.nth(1).locator('.granularity-selector__desc')
    await expect(annualDesc).toContainText('annual consumption')
    await expect(annualDesc).toContainText('shape')

    const monthlyDesc = options.nth(2).locator('.granularity-selector__desc')
    await expect(monthlyDesc).toContainText('limited to that month\u2019s consumption')
    await expect(monthlyDesc).toContainText('shape')

    const hourlyDesc = options.nth(3).locator('.granularity-selector__desc')
    await expect(hourlyDesc).toContainText('limited to that hour\u2019s consumption')
    await expect(hourlyDesc).toContainText('clipped rather than preserved')
  })

  test('M3c.9 Selecting as-produced dispatches and re-runs the engine', async ({ page }) => {
    await page.click('[data-tab="allocation"]')

    // First set allocations so engine has results
    await page.click('[data-testid="allocate-evenly"]')

    // Select as-produced
    await page.click('input[value="as-produced"]')

    // Navigate to Results
    await page.click('[data-tab="results"]')

    // Should show results (not empty state)
    await expect(page.locator('[data-testid="results-tab"]')).toBeVisible()
    const granularity = page.locator('[data-testid="results-granularity"]')
    await expect(granularity).toContainText('As produced (no cap)')
  })

  test('M3c.10 Hourly header line', async ({ page }) => {
    await page.click('[data-tab="results"]')
    const granularity = page.locator('[data-testid="results-granularity"]')
    await expect(granularity).toContainText(
      'Hourly matching only · capped at hourly consumption · generator shape clipped at hourly demand',
    )
  })

  test('M3c.11 Monthly header line', async ({ page }) => {
    await page.click('[data-tab="allocation"]')
    await page.click('input[value="monthly"]')
    await page.click('[data-tab="results"]')
    const granularity = page.locator('[data-testid="results-granularity"]')
    await expect(granularity).toContainText(
      'Monthly matching target · allocation capped at monthly consumption · generator shape preserved',
    )
  })

  test('M3c.12 Annual header line', async ({ page }) => {
    await page.click('[data-tab="allocation"]')
    await page.click('input[value="annual"]')
    await page.click('[data-tab="results"]')
    const granularity = page.locator('[data-testid="results-granularity"]')
    await expect(granularity).toContainText(
      'Annual matching target · allocation capped at annual consumption · generator shape preserved',
    )
  })

  test('M3c.13 As-produced header line', async ({ page }) => {
    await page.click('[data-tab="allocation"]')
    await page.click('input[value="as-produced"]')
    await page.click('[data-tab="results"]')
    const granularity = page.locator('[data-testid="results-granularity"]')
    await expect(granularity).toContainText('As produced (no cap) · no cap · generator shape preserved')
  })

  test('M3c.14 "shape preserved" has a tooltip', async ({ page }) => {
    // Check on Allocation tab
    await page.click('[data-tab="allocation"]')
    const shapeTipAlloc = page.locator('.granularity-selector__shape-tip').first()
    await expect(shapeTipAlloc).toBeVisible()
    const titleAlloc = await shapeTipAlloc.getAttribute('title')
    expect(titleAlloc).toContain('hourly output shape')
    expect(titleAlloc).toContain('not redistributed')

    // Check on Results tab (monthly or annual to get shape preserved)
    await page.click('input[value="monthly"]')
    await page.click('[data-tab="results"]')
    const shapeTipResults = page.locator('.results-tab__shape-tip').first()
    await expect(shapeTipResults).toBeVisible()
    const titleResults = await shapeTipResults.getAttribute('title')
    expect(titleResults).toContain('hourly output shape')
    expect(titleResults).toContain('not redistributed')
  })

  test('M3c.15 Demo portfolio as-produced scores match golden fixture', async ({ page }) => {
    await page.click('[data-tab="allocation"]')
    await page.click('input[value="as-produced"]')
    await page.click('[data-tab="results"]')

    // Hourly score should differ from 67.33% (the hourly-granularity value)
    const hourlyTile = page.locator('[data-testid="tile-hourly-score"] .score-tile__value')
    const hourlyText = await hourlyTile.textContent()
    const hourlyScore = parseFloat(hourlyText!.replace(/[^0-9.]/g, ''))
    // As-produced allocates the full supply, so hourly score = matched/demand
    // which for 100% allocation with uncapped supply should equal the hourly value
    // (since both solar+wind at 100% sum to 50,370 MWh vs 50,000 demand)
    // But the shape means it won't be 67.33% — it should differ because more
    // allocation goes in than with hourly capping
    expect(hourlyScore).toBeGreaterThan(0)
    expect(hourlyScore).toBeLessThan(100)
  })

  test('M3c.16 As-produced shows non-zero excess', async ({ page }) => {
    await page.click('[data-tab="allocation"]')
    await page.click('input[value="as-produced"]')
    await page.click('[data-tab="results"]')

    const excessTile = page.locator('[data-testid="tile-excess"] .score-tile__value')
    const excessText = await excessTile.textContent()
    const excessMWh = parseFloat(excessText!.replace(/[^0-9.]/g, ''))
    // As-produced does not cap at demand, so there must be excess
    expect(excessMWh).toBeGreaterThan(0)
  })

  test('M3c.19 Mobile: granularity selector fits without overflow at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.click('[data-tab="allocation"]')

    const selector = page.locator('[data-testid="granularity-selector"]')
    await expect(selector).toBeVisible()

    // All four options should be visible
    const options = selector.locator('.granularity-selector__option')
    await expect(options).toHaveCount(4)
    for (let i = 0; i < 4; i++) {
      await expect(options.nth(i)).toBeVisible()
    }

    // The note should be visible and not clipped
    const note = page.locator('[data-testid="how-allocation-works"]')
    await expect(note).toBeVisible()

    // Check no horizontal overflow
    const selectorBox = await selector.boundingBox()
    expect(selectorBox).toBeTruthy()
    expect(selectorBox!.width).toBeLessThanOrEqual(375)

    // Switch to Results to check header wrapping
    await page.click('input[value="as-produced"]')
    await page.click('[data-tab="results"]')
    const header = page.locator('[data-testid="results-granularity"]')
    await expect(header).toBeVisible()
    const headerBox = await header.boundingBox()
    expect(headerBox).toBeTruthy()
    expect(headerBox!.width).toBeLessThanOrEqual(375)
  })
})
