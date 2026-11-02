# Generator notes — Milestone M2

## What was built

### App shell (M2.1–M2.4)
- **Header**: Granular wave logo from `public/brand/granular-wave.svg` with "Scenario Analysis Tool" in Space Grotesk.
- **Tab bar**: Four tabs — Portfolio, Allocation, Results, Compare. Results and Compare show placeholder text "Coming soon".
- **CTA band**: Visible on every tab, links to `https://granular-energy.com` opening in a new browser tab.
- **Responsive**: All components use CSS from `src/styles/app.css` with relative sizing and `overflow-x: auto` on the matrix container for mobile viewports.

### Portfolio tab (M2.5–M2.13)
- Two distinct **Consumers** and **Generators** panels, each with "Add from library" and "Upload CSV" buttons.
- **Library picker** modal lists all 9 consumer profiles and all 7 generator profiles from `registry.json` by human-readable name.
- **Consumer cards** show editable annual demand (MWh) pre-filled from `defaultAnnualMWh`.
- **Generator cards** show editable capacity (MW) pre-filled from `defaultCapacityMW`, plus capacity factor and annual generation (MW × CF × 8,760).
- **Sparkline** SVG shape preview on every member card (downsampled from 8,760 to ≤100 points).
- **Remove** button on each card; removal updates the matrix and score strip.
- **Max 5** limit enforced; add buttons disabled at the limit.
- **CSV upload modal** with timezone selector (IANA zones, defaults UTC), unit selector (kWh/MWh/kW/MW), and preview sparkline. Uses the existing `src/io/profileUpload.ts` (not rewritten). Error messages from the IO layer (e.g. missing hours) are shown as-is.

### Allocation tab (M2.14–M2.18)
- **Matrix grid** with generators as rows, consumers as columns. Each cell is an editable number input (0–100).
- **Row totals** with visual warning (red background and ⚠ icon) when exceeding 100%.
- **Allocate evenly** button fills equal shares (e.g. 50/50 for 2 consumers, 34/33/33 for 3).
- **Granularity selector** with Hourly, Monthly, Annual options, each with a one-line explanation. Changing selection updates the score strip.
- Matrix scrolls horizontally at narrow viewports via `overflow-x: auto`.

### Score strip (M2.21–M2.22)
- Persistent teal band visible on Portfolio and Allocation tabs showing "Hourly matching score" and "Annual matching score".
- With the demo portfolio, shows **67.33 %** for both, matching the golden fixture `single-consumer-solar-wind` at hourly granularity.

### State and persistence (M2.19–M2.20)
- **localStorage** persistence via `src/state/persistence.ts`. All portfolio state (consumers, generators, sizing, matrix, granularity) is saved on every change and restored on reload.
- **Demo portfolio** on first visit: data centre (50,000 MWh), solar PV temperate (25 MW), wind onshore temperate (10 MW), each generator 100% to the consumer, hourly granularity.

### Sample CSVs (M2.23)
- `public/samples/sample-consumption.csv` — office-like consumption (~2,000 MWh/yr).
- `public/samples/sample-generation.csv` — solar-like generation (~1,000 MWh/yr).
- Both have 8,760 hourly rows (2025-01-01 00:00 to 2025-12-31 23:00) in ISO naive format, UTC.

### Tests (M2.24–M2.26)
- **Unit tests**: `src/state/__tests__/portfolioReducer.test.ts` — 13 tests for `evenShares`, add/remove consumers and generators, allocation clamping, sizing updates, granularity switching.
- **E2e tests**: `tests/e2e/m2-portfolio-allocation.spec.ts` — 18 Playwright specs covering all key M2 criteria.
- `npm run typecheck`, `npm test`, `npm run lint`, and `npm run build` all pass clean.

## What was not finished

Everything in the M2 contract was implemented.

## How to test

1. `npm run dev` — open `http://localhost:5173` in a browser.
2. The demo portfolio loads automatically with the score strip showing 67.33% for both scores.
3. Use the Portfolio tab to add/remove consumers and generators from the library or via CSV upload.
4. Use the Allocation tab to adjust the matrix and granularity selector.
5. Verify mobile layout at 375px viewport width.
6. For automated verification:
   - `npm run typecheck && npm test && npm run lint` for unit tests.
   - `npm run build && npm run test:e2e` for Playwright e2e tests.
