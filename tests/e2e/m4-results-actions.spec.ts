import { expect, test } from '@playwright/test'

test.describe('M4: Results tab action bar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      localStorage.setItem('scenario-tool.signedUp', new Date().toISOString())
    })
    await page.goto('/')
    // Navigate to Results tab (demo portfolio has results ready)
    await page.click('[data-tab="results"]')
  })

  test('Action bar is visible when engine results exist', async ({ page }) => {
    const actions = page.locator('[data-testid="results-actions"]')
    await expect(actions).toBeVisible()
    await expect(page.locator('[data-testid="save-scenario-btn"]')).toBeVisible()
    await expect(page.locator('[data-testid="download-scenario-btn"]')).toBeVisible()
    await expect(page.locator('[data-testid="download-report-btn"]')).toBeVisible()
    await expect(page.locator('[data-testid="load-scenario-btn"]')).toBeVisible()
  })

  test('Save scenario button opens prompt and saves to localStorage', async ({ page }) => {
    // Set up dialog handler before clicking
    page.on('dialog', async (dialog) => {
      expect(dialog.type()).toBe('prompt')
      expect(dialog.defaultValue()).toBe('Scenario 1')
      await dialog.accept('My test scenario')
    })

    await page.click('[data-testid="save-scenario-btn"]')

    // Confirmation message should appear briefly
    const msg = page.locator('[data-testid="save-confirmation"]')
    await expect(msg).toContainText('Saved "My test scenario"')

    // Verify it was persisted in localStorage
    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('sat-v3-scenarios')
      return raw ? JSON.parse(raw) : []
    })
    expect(stored).toHaveLength(1)
    expect(stored[0].name).toBe('My test scenario')
    expect(stored[0].results).toBeDefined()
    expect(stored[0].portfolio).toBeDefined()
  })

  test('Save scenario is cancelled when user dismisses prompt', async ({ page }) => {
    page.on('dialog', async (dialog) => {
      await dialog.dismiss()
    })

    await page.click('[data-testid="save-scenario-btn"]')

    // No confirmation message
    await expect(page.locator('[data-testid="save-confirmation"]')).not.toBeVisible()

    // Nothing saved
    const stored = await page.evaluate(() => localStorage.getItem('sat-v3-scenarios'))
    expect(stored).toBeNull()
  })

  test('Download scenario button triggers JSON download', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="download-scenario-btn"]')
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.json$/)
  })

  test('Download report button triggers PDF download', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="download-report-btn"]')
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.pdf$/)
  })

  test('Load scenario shows empty message when no scenarios saved', async ({ page }) => {
    await page.click('[data-testid="load-scenario-btn"]')
    await expect(page.locator('[data-testid="load-scenario-empty"]')).toBeVisible()
    await expect(page.locator('[data-testid="load-scenario-empty"]')).toContainText('No saved scenarios')
  })

  test('Load scenario lists saved scenarios and loads one', async ({ page }) => {
    // First save a scenario
    page.on('dialog', async (dialog) => {
      await dialog.accept('Test load scenario')
    })
    await page.click('[data-testid="save-scenario-btn"]')
    await expect(page.locator('[data-testid="save-confirmation"]')).toBeVisible()

    // Open the load dropdown
    await page.click('[data-testid="load-scenario-btn"]')
    const list = page.locator('[data-testid="load-scenario-list"]')
    await expect(list).toBeVisible()

    // Should contain the saved scenario
    const items = list.locator('.results-tab__load-item')
    await expect(items).toHaveCount(1)
    await expect(items.first()).toContainText('Test load scenario')

    // Click to load it (should close dropdown)
    await items.first().click()
    await expect(list).not.toBeVisible()
  })

  test('Action bar is not visible when no results exist', async ({ page }) => {
    // Clear portfolio so there are no results
    await page.evaluate(() => {
      localStorage.clear()
      localStorage.setItem('scenario-tool.signedUp', new Date().toISOString())
    })
    await page.goto('/')

    // Remove all generators to clear engine results — go to portfolio tab
    await page.click('[data-tab="portfolio"]')

    // Remove all generators (click all remove buttons in the generators panel)
    const genRemoveButtons = page.locator('[data-testid="generators-panel"] .member-card__remove')
    const genCount = await genRemoveButtons.count()
    for (let i = genCount - 1; i >= 0; i--) {
      await genRemoveButtons.nth(i).click()
    }

    // Now go to results — should show empty state
    await page.click('[data-tab="results"]')
    await expect(page.locator('[data-testid="results-empty"]')).toBeVisible()
    await expect(page.locator('[data-testid="results-actions"]')).not.toBeVisible()
  })
})
