import { expect, test } from '@playwright/test'

test.describe('M5: Full demo flow end-to-end', () => {
  test('Demo portfolio loads → Allocation shows 100% → Results scores match → save → Compare → export JSON', async ({
    page,
  }) => {
    // 1. Clear state and load fresh
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      localStorage.setItem('scenario-tool.signedUp', new Date().toISOString())
    })
    await page.goto('/')

    // 2. Demo portfolio should be loaded on the Portfolio tab
    const consumersPanel = page.locator('[data-testid="consumers-panel"]')
    await expect(consumersPanel).toBeVisible()
    await expect(consumersPanel.locator('.member-card')).toHaveCount(1)
    await expect(consumersPanel).toContainText('Data centre')

    const generatorsPanel = page.locator('[data-testid="generators-panel"]')
    await expect(generatorsPanel).toBeVisible()
    await expect(generatorsPanel.locator('.member-card')).toHaveCount(2)

    // 3. Navigate to Allocation tab — matrix should show 100% for both generators
    await page.click('[data-tab="allocation"]')
    const matrixInputs = page.locator('[data-testid="allocation-matrix"] input[type="number"]')
    await expect(matrixInputs).toHaveCount(2)
    await expect(matrixInputs.nth(0)).toHaveValue('100')
    await expect(matrixInputs.nth(1)).toHaveValue('100')

    // 4. Navigate to Results tab — check scores
    await page.click('[data-tab="results"]')
    const resultsTab = page.locator('[data-testid="results-tab"]')
    await expect(resultsTab).toBeVisible()

    // Hourly score: 67.33%
    const hourlyTile = page.locator('[data-testid="tile-hourly-score"]')
    await expect(hourlyTile).toContainText('67.33')
    await expect(hourlyTile).toContainText('%')

    // Annual score: 100.74%
    const annualTile = page.locator('[data-testid="tile-annual-score"]')
    await expect(annualTile).toContainText('100.74')
    await expect(annualTile).toContainText('%')

    // Granularity header should show "Hourly matching only"
    const granularity = page.locator('[data-testid="results-granularity"]')
    await expect(granularity).toContainText('Hourly matching only')

    // 5. Save the scenario twice (Compare requires at least 2)
    let dialogCount = 0
    page.on('dialog', async (dialog) => {
      dialogCount++
      await dialog.accept(dialogCount === 1 ? 'Demo scenario' : 'Demo scenario 2')
    })
    await page.click('[data-testid="save-scenario-btn"]')
    await expect(page.locator('[data-testid="save-confirmation"]')).toContainText('Saved "Demo scenario"')
    // Wait for confirmation to disappear, then save a second copy
    await page.waitForTimeout(2100)
    await page.click('[data-testid="save-scenario-btn"]')
    await expect(page.locator('[data-testid="save-confirmation"]')).toContainText('Saved "Demo scenario 2"')

    // 6. Navigate to Compare — saved scenarios should appear in the picker
    await page.click('[data-tab="compare"]')
    const compareTab = page.locator('[data-testid="compare-tab"]')
    await expect(compareTab).toBeVisible()
    await expect(compareTab).toContainText('Demo scenario')

    // 7. Export scenario JSON file from Results tab
    await page.click('[data-tab="results"]')
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="download-scenario-btn"]')
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.json$/)
  })
})
