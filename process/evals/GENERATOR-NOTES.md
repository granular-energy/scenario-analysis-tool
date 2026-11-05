# Generator notes — Milestone M3b

## What was built

### Generator sizing (M3b.1–M3b.4)
- **Annual MWh input**: Generator card label changed to "Annual generation (MWh)". Field is pre-filled from `defaultCapacityMW × capacityFactor × 8760` when adding from the library (Solar PV Temperate: 19,272 MWh; Wind Onshore Temperate: 52,560 MWh). Demo portfolio: Solar 24,090 MWh, Wind 26,280 MWh.
- **Capacity hint**: Below the sizing input, "≈ {MW} MW at a {CF} capacity factor" computed as `annualMWh / (capacityFactor × 8760)`. Demo solar shows "≈ 25 MW at a 0.11 capacity factor".
- **Schema migration**: `migratePortfolioState()` in `src/state/persistence.ts` detects generators with `capacityMW` but no `annualMWh`, converts via `Math.round(capacityMW × capacityFactor × 8760)`, removes `capacityMW`, and retains `capacityFactor`. Unit tested.
- **Engine parity**: Golden fixture scores unchanged (hourly 67.33%, annual 67.33%) because `shape × annualMWh` produces the same hourly MWh as the old `shape × capacityMW × capacityFactor × 8760`.

### Allocation matrix enhancements (M3b.5–M3b.9)
- **Row/column headers**: Each row header shows the generator's name and formatted annual MWh (e.g. "Solar PV temperate — 24,090 MWh"). Column headers show consumer name and annual consumption MWh.
- **% / MWh toggle**: A toggle bar ("Enter as: % / MWh") switches which field is editable. Default is %. In MWh mode, typing 12,045 MWh in the solar→DC cell shows "50.0 %" computed. The matrix state remains in percent internally.
- **Row and column totals**: Each row shows total allocated MWh and %. Warning indicator (red background, ⚠) appears if row exceeds 100%. Column totals row shows how much each consumer receives as MWh and % of their consumption.
- **Allocate evenly**: Works in both modes, distributing equal percentages across consumers.

### Matching granularity selector (M3b.10–M3b.11)
- **Introductory text**: "In every method, generation is allocated to each consumer largest generator first…" paragraph above the three options.
- **Full labels**: "Hourly matching only", "Monthly matching target", "Annual matching target" with multi-sentence explanatory descriptions for each.
- **Label propagation**: The Results tab header, score strip tooltip, and all references use the full label (not the short internal value).

### Sankey chart redesign (M3b.12–M3b.16)
- **Three-column layout**: Generators (column 0) → Consumers (column 1) → Outcomes (column 2). Outcome nodes: "Matched", "Excess", "Surplus generation".
- **Surplus flow**: Surplus flows run directly from each generator to the "Surplus generation" outcome node, never through the consumer column.
- **Stale node fix**: React `key={sankeyKey}` forces Highcharts to fully recreate the chart when the consumer selector changes. No duplicate labels or stale nodes.
- **Per-consumer view**: Only that consumer's share of each generator appears. Surplus generation is omitted, with explanatory note: "Surplus generation is a portfolio-level concept…"
- **Flow balance**: Unit test (`sankeyBalance.test.ts`) verifies that for each generator, outgoing link weights sum to its total generation MWh, at all three granularities.
- **Tooltips and overlap**: `nodePadding: 12`, `minLinkWidth: 1`, `allowOverlap: false`, `linkOpacity: 0.5`. Custom `tooltip.formatter` on all nodes and links: link tooltips show MWh and percentage of source (e.g. "Solar PV temperate → Data centre: 24,090 MWh (100.0% of Solar PV temperate)"); node tooltips show the node's total MWh.

### Bar chart stacking (M3b.17–M3b.18)
- **Correct stack order**: All three bar charts (average day, monthly breakdown, example day) stack from bottom: matched per generator (technology colour) → excess per generator (pastel colour, labelled "{name} in excess") → unmatched demand (hatched pattern). Demand spline (#0F4974) drawn on top.
- **Excess omission**: Generators with total excess below 0.01 MWh are omitted from the chart. At hourly granularity with the demo portfolio, no excess series appear.

### FEEDBACK.md fixes (M3b.19–M3b.20)
- **Example day picker**: Changed to a `<select>` dropdown with 365 options showing "d Month" format (e.g. "1 May"). No year anywhere in the control, chart title, or axis labels.
- **Monthly y-axis label**: Explicitly set `rotation: 0, align: 'high'` on the yAxis title in `monthlyBreakdownConfig.ts`. Label is now horizontal, matching the other charts.
- Marked all three FEEDBACK.md items as `[fixed in M3b]`.

### Invariants (M3b.21–M3b.22)
- All golden-fixture parity tests pass (no fixture changes).
- `npm run build`, `npm run typecheck`, `npm run lint` all pass clean.
- Existing M2/M3 e2e tests updated (not deleted) for new generator sizing and labels.

### Mobile responsiveness (M3b.23)
- At 375px viewport: generator card sizing input full-width with visible hint, allocation matrix horizontally scrollable with readable headers, granularity selector descriptions readable without overflow, Sankey chart scrollable, results header stacks vertically, day picker wraps.

## Files changed

### Types and state
- `src/state/portfolioTypes.ts` — `capacityMW` → `annualMWh` on `PortfolioGenerator` and action payload
- `src/state/portfolioReducer.ts` — `UPDATE_GENERATOR_SIZING` uses `annualMWh`
- `src/state/usePortfolio.ts` — `scaleGenerator` uses `g.annualMWh` directly
- `src/state/demoPortfolio.ts` — Demo generators sized in MWh
- `src/state/persistence.ts` — Added `migratePortfolioState()` for old schema migration

### Components
- `src/components/portfolio/GeneratorCard.tsx` — Annual MWh input with capacity hint
- `src/components/portfolio/PortfolioTab.tsx` — Library/upload creation uses `annualMWh`
- `src/components/allocation/AllocationMatrix.tsx` — % / MWh toggle, headers with volumes, row/column totals
- `src/components/allocation/GranularitySelector.tsx` — Intro text and full descriptions
- `src/components/results/ResultsTab.tsx` — Sankey key, day picker dropdown, excess computation, surplus note
- `src/components/results/granularityLabel.ts` — Full label text
- `src/components/layout/ScoreStrip.tsx` — Granularity tooltip

### Chart configs
- `src/components/results/charts/sankeyConfig.ts` — Three-column layout, surplus flows, per-consumer view
- `src/components/results/charts/averageDayConfig.ts` — Matched + excess series
- `src/components/results/charts/exampleDayConfig.ts` — Matched + excess series
- `src/components/results/charts/monthlyBreakdownConfig.ts` — Corrected stacking, horizontal y-axis label

### Styles
- `src/styles/app.css` — Matrix toggle, header MWh, cell computed, totals row, granularity intro, Sankey note, mobile responsive CSS

### Tests
- `src/state/__tests__/persistence.test.ts` — Migration unit tests
- `src/state/__tests__/portfolioReducer.test.ts` — Updated for annualMWh
- `src/components/results/charts/__tests__/sankeyBalance.test.ts` — Flow balance assertions
- `src/components/results/charts/__tests__/averageDayConfig.test.ts` — Updated for matched/excess fields
- `src/components/results/__tests__/granularityLabel.test.ts` — Updated label text
- `tests/e2e/m3b-enhancements.spec.ts` — 14 new M3b e2e tests
- `tests/e2e/m2-portfolio-allocation.spec.ts` — Updated for new generator card
- `tests/e2e/m3-results.spec.ts` — Updated for new labels and day picker

## Fix from evaluator feedback (second attempt)

1. **M3b.16 — Sankey tooltip percentage missing**: Replaced the static `pointFormat` with a custom `tooltip.formatter` function. Link tooltips now compute `weight / sourceTotal * 100` and display both MWh and percentage of the source node (e.g. "Solar PV temperate → Data centre: 24,090 MWh (100.0% of Solar PV temperate)"). Node tooltips show the node's total MWh via pre-computed `nodeTotals` map. The `nodePadding`, `minLinkWidth`, and `allowOverlap` settings were already correct.

## What was not finished

All 23 criteria in the M3b contract were implemented.

## How to test

1. `npm run dev` — open `http://localhost:5173`.
2. **Generator sizing**: Demo portfolio shows Solar 24,090 MWh ("≈ 25 MW at a 0.11 capacity factor") and Wind 26,280 MWh. Add Solar PV Temperate from library — pre-fills 19,272.
3. **Schema migration**: Set `localStorage.setItem('sat-v3-portfolio', JSON.stringify({...}))` with `capacityMW: 25, capacityFactor: 0.11` on a generator, reload — shows migrated 24,090 MWh.
4. **Allocation matrix**: Navigate to the Allocation tab. Row/column headers show name + MWh. Toggle to MWh input mode, type 12045 in solar→DC cell, see "50.0 %" computed. Row totals show 24,090 MWh / 100.0 %. Column totals row visible.
5. **Granularity selector**: Three options with full labels and descriptions. Intro text visible.
6. **Results tab**: Granularity label shows full text. Sankey has three columns (Generators, Consumers, Outcomes). Switch consumer selector — no stale nodes. Per-consumer view omits surplus with explanatory note.
7. **Bar charts**: Switch to monthly granularity — excess series appear with pastel colours. At hourly, no excess series in legend.
8. **Example day**: Picker shows "1 May" etc., no year.
9. **Monthly y-axis**: "MWh" label horizontal at top of axis.
10. **Mobile**: Chrome DevTools → 375×812 viewport; navigate all tabs — no clipping or overflow.
11. **Automated**: `npm run typecheck && npm test && npm run lint` (83 unit tests, all pass). `npm run build && npm run test:e2e` (50 e2e tests, all pass).
