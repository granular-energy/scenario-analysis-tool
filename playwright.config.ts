import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:4173', headless: true },
  // Always build before serving: reusing a leftover preview server ran the suite against stale code
  webServer: {
    command: 'VITE_HUBSPOT_FORM_ID=REPLACE_WITH_FORM_ID npm run build && npm run preview',
    port: 4173,
    reuseExistingServer: false,
  },
})
