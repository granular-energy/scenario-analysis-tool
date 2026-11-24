# Generator notes — Milestone M6: HubSpot sign-up gate

## What was built

All 19 M6 criteria addressed. Summary of changes:

### Core files

1. **`src/config.ts`** (M6.1, M6.18) — Centralised HubSpot configuration:
   - `HUBSPOT_PORTAL_ID` = `'25772642'`
   - `HUBSPOT_REGION` = `'eu1'`
   - `HUBSPOT_FORM_ID` = `'REPLACE_WITH_FORM_ID'`
   - `HUBSPOT_EMBED_URL` = `'https://js-eu1.hsforms.net/forms/embed/v2.js'`
   - `isHubSpotConfigured()` returns `false` for the placeholder string

2. **`src/io/signupGate.ts`** (M6.5, M6.6, M6.7, M6.8, M6.16) — Gate state helpers:
   - `hasSignedUp()` — reads `scenario-tool.signedUp` from localStorage, validates ISO format
   - `markSignedUp()` — writes current timestamp
   - `getSignedUpTimestamp()` — returns raw timestamp or null

3. **`src/components/layout/SignUpGate.tsx`** (M6.2–M6.12) — React component:
   - **Always loads the HubSpot embed script first** (`'loading'` → script loaded → branch on `isHubSpotConfigured()`). This ensures the error state is reachable even with the placeholder form ID, by blocking the script network request.
   - If script loads and form ID is placeholder → `'dev'` state with "Development mode" notice and "Continue without signing up" button
   - If script loads and form ID is configured → `'form'` state with embedded HubSpot form
   - If script fails (network blocked or 5-second timeout) → `'error'` state with "could not load" message, contact link, no Continue button (tool stays locked)
   - Full-screen modal overlay with blurred, pointer-events-none backdrop
   - `?signedUp=1` query param bypass, idempotent (preserves existing timestamp)
   - Focus trap: Tab/Shift+Tab cycling within modal; redirects focus inside modal if active element is outside
   - Auto-focus on first focusable element when state changes
   - Responsive at 375px with 44px touch targets
   - All design tokens from CSS variables, zero hardcoded hex values

4. **`src/App.tsx`** — Wrapped entire app with `<SignUpGate>` inside `<PortfolioProvider>`

5. **`src/styles/app.css`** — Gate-specific CSS using only design tokens

### Tests

6. **`src/io/__tests__/signupGate.test.ts`** — 10 unit tests for gate state logic (M6.16)
7. **`src/io/__tests__/config.test.ts`** — 5 unit tests for config exports (M6.1)
8. **`tests/e2e/m6-signup-gate.spec.ts`** — 11 e2e tests covering M6.2–M6.14

### Existing test updates

9. **All 8 existing e2e spec files updated** (M6.15) — Added `localStorage.setItem('scenario-tool.signedUp', new Date().toISOString())` after every `localStorage.clear()` call

### Downloads

10. **PDF/JSON downloads ungated** (M6.13, M6.14) — No per-download gate existed; the whole-app gate is the only gate

11. **Engine purity preserved** (M6.19) — No imports from config/components/state in `src/engine/`

## Test results

- `npm run typecheck` — 0 errors
- `npm test` — 152 unit tests pass (16 files)
- `npm run lint` — 0 errors
- `npm run test:e2e` — 93 e2e tests pass (9 spec files)

## What could not be finished

Nothing — all 19 criteria addressed.

## Notes for the evaluator

- **M6.9 fix from previous attempt**: The component now always starts in `'loading'` state and attempts to load the HubSpot embed script, regardless of whether the form ID is a placeholder. This means blocking `**/js-eu1.hsforms.net/**` via `page.route()` will trigger `script.onerror` → error state, even with the placeholder form ID. The error state shows "could not load" text, a `granular-energy.com/contact` link, and no Continue button.
- **Dev mode**: The HubSpot script loads from the CDN, and once it loads, `isHubSpotConfigured()` returns false for the placeholder → dev mode with Continue button. This path works in all tests that don't block the network.
- **Testing the gate**: Navigate to `http://localhost:4173` after clearing localStorage to see the gate. The script loads from `js-eu1.hsforms.net`, detects the placeholder form ID, and shows dev mode. Click "Continue without signing up" to dismiss. Navigate to `/?signedUp=1` to bypass.
