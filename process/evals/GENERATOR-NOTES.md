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
   - Full-screen modal with blurred, pointer-events-none backdrop
   - Tool description (two sentences) + dev-mode notice for placeholder form ID
   - "Continue without signing up" button sets flag and dismisses
   - `?signedUp=1` query param bypass, idempotent (preserves existing timestamp)
   - HubSpot form loading with 5-second timeout; error fallback with contact link
   - Focus trap (Tab/Shift+Tab cycling) with auto-focus on open
   - Responsive at 375px with 44px touch targets
   - All design tokens from CSS variables, zero hardcoded hex values

4. **`src/App.tsx`** — Wrapped entire app with `<SignUpGate>` inside `<PortfolioProvider>`

5. **`src/styles/app.css`** — Gate-specific CSS using only design tokens

### Tests

6. **`src/io/__tests__/signupGate.test.ts`** — 10 unit tests for gate state logic (M6.16)
7. **`src/io/__tests__/config.test.ts`** — 5 unit tests for config exports (M6.1)
8. **`tests/e2e/m6-signup-gate.spec.ts`** — 11 e2e tests covering M6.2–M6.14

### Existing test updates

9. **All 8 existing e2e spec files updated** (M6.15) — Added `localStorage.setItem('scenario-tool.signedUp', new Date().toISOString())` after every `localStorage.clear()` call:
   - `m2-portfolio-allocation.spec.ts`
   - `m3-results.spec.ts`
   - `m3b-enhancements.spec.ts`
   - `m3c-as-produced.spec.ts`
   - `m4-compare.spec.ts`
   - `m4-results-actions.spec.ts`
   - `m4-pdf-report.spec.ts`
   - `m5-full-flow.spec.ts`

### Downloads

10. **PDF/JSON downloads ungated** (M6.13, M6.14) — No per-download gate existed; the whole-app gate is the only gate. Downloads work freely once past the sign-up gate.

11. **Engine purity preserved** (M6.19) — No imports from config/components/state in `src/engine/`.

## Test results

- `npm run typecheck` — 0 errors
- `npm test` — 152 unit tests pass (16 files)
- `npm run lint` — 0 errors
- `npm run test:e2e` — 93 e2e tests pass (9 spec files)

## What could not be finished

Nothing — all 19 criteria addressed.

## Notes for the evaluator

- **Dev mode**: Since `HUBSPOT_FORM_ID` is `'REPLACE_WITH_FORM_ID'`, the app always shows the development-mode bypass. The HubSpot form loading and error states are code-complete but cannot be e2e tested without a real form ID.
- **M6.9 (HubSpot script failure)**: With the placeholder form ID, `isHubSpotConfigured()` returns false, so the app goes straight to dev mode rather than attempting to load the HubSpot script. The error fallback path (timeout, script error) is implemented but only activates when a real form ID is configured. The e2e test verifies the dev-mode path since that's what runs with the placeholder.
- **Testing the gate**: Navigate to `http://localhost:4173` after clearing localStorage to see the gate. Click "Continue without signing up" to dismiss. Reload to verify persistence. Navigate to `/?signedUp=1` to test URL bypass.
- **All existing specs**: Each spec's beforeEach sets the signup flag immediately after clearing localStorage, so the gate never blocks them.
