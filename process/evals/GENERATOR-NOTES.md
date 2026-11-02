# Generator notes — Milestone M3

## What was built

### Results tab header (M3.1–M3.2)
- **Granularity description**: plain English text derived from `engineResult.granularity` — e.g. "Hourly matching, shape preserved within each hour". Updates when the user changes granularity on the Allocation tab.
- **Consumer selector**: dropdown with "Whole portfolio" (default) plus one entry per consumer. Switching consumers is local UI state — does not re-run the engine (M3.15).

### Score tiles (M3.3–M3.7)
- **Hourly matching score**: large teal-accented number, 67.33% for the demo portfolio.
- **Annual (volumetric)**: beside the hourly tile, clearly labelled. 67.33% for the demo at hourly granularity (identical because hourly matching is the strictest).
- **Excess MWh**: 0 MWh at hourly granularity (correct — allocation never exceeds demand in any hour).
- **Unmatched demand**: ~16,335 MWh (≈ 50,000 × (1 − 67.33/100)).
- Each tile has an info button (ⓘ) with a hover/click tooltip explaining the metric.

### Five Highcharts charts (M3.8–M3.12)
- **Chart 1 — Average 24-hour profile**: 24 x-axis points, stacked area bars by generator technology, demand spline on top, hatched unmatched region.
- **Chart 2 — Hourly matching heatmap**: 12×24 grid (months × hours), colour intensity represents average match percentage.
- **Chart 3 — Monthly breakdown**: 12 stacked bars (matched MWh by technology), unmatched hatched segment, monthly score line on secondary axis.
- **Chart 4 — Example day**: date picker defaults to 1 May (day 120), 24 hourly bars with demand spline, updates when date changes.
- **Chart 5 — Sankey**: generator → consumer → matched/excess flows, plus unallocated flows per generator. Zero excess flows at hourly granularity.

### Consumer switching (M3.13–M3.14)
- Selecting a consumer updates all tiles and charts. With the demo's single consumer, values match the portfolio view.
- Adding a second consumer with different allocation percentages shows different hourly scores per consumer.

### Empty state (M3.16)
- When all allocation cells are 0, the Results tab shows a guidance message and no charts/tiles.

### Design compliance (M3.17–M3.19)
- Technology colours come from `src/components/results/charts/palette.ts` — no hard-coded hex colours in component files.
- Chart defaults use Inter font, dotted grid lines, legend below, no top/right borders.
- At 375px viewport width, tiles wrap to a 2×2 grid; charts resize responsively.

### Technical (M3.20–M3.23)
- Results tab fully replaces the old "Coming soon" placeholder.
- `npm run typecheck`, `npm test` (75 tests), `npm run lint`, and `npm run build` all pass clean.

## Highcharts integration approach

The standard `highcharts-react-official` package crashes in Vite 8's Rolldown bundler due to CJS interop issues (React error #130: element type is object). The fix:

1. **Custom `Chart.tsx` wrapper**: uses `Highcharts.chart()` imperatively via `useEffect` + `useRef`, updating on options change and destroying on unmount. This avoids the CJS default-export interop problem.

2. **Vite ESM aliases**: `vite.config.ts` maps `highcharts` and its sub-modules (`highcharts/modules/heatmap`, etc.) to their ESM source builds (`highcharts/es-modules/masters/*.src.js`) using regex `find` patterns. This ensures all modules share the same `Globals.js` singleton.

3. **Side-effect imports**: `Chart.tsx` imports `highcharts/highcharts-more`, `highcharts/modules/heatmap`, `highcharts/modules/sankey`, and `highcharts/modules/pattern-fill` for side effects. The ESM versions register themselves at import time.

## Fixes from evaluator feedback (second attempt)

1. **M3.9 — Heatmap yAxis order**: Set `reversed: true` on yAxis in `heatmapConfig.ts` so Jan appears at the top row and Dec at the bottom.

2. **M3.10 — Excess epsilon at hourly granularity**: Added a 0.01 MWh tolerance threshold in `ResultsTab.tsx` when computing per-generator monthly excess (`raw < 0.01 ? 0 : raw`), and tightened the filter in `monthlyBreakdownConfig.ts` (`.some(v => v >= 0.01)`). At hourly granularity, no excess series appears in the chart legend or data.

3. **M3.17 — Hard-coded hex colours**: Moved all hex colour literals from `heatmapConfig.ts` (6 gradient stops + border), `chartDefaults.ts` (`#897F78`), and `sankeyConfig.ts` (`#2A2929`) into `palette.ts` as named exports (`HEATMAP_GRADIENT_STOPS`, `NEUTRAL_600`, `NEUTRAL_1000`, `WHITE`). After the fix, grepping `src/components/results/` for hex codes finds them only in `palette.ts` and test files.

## What was not finished

Everything in the M3 contract was implemented. All 23 criteria are covered.

## How to test

1. `npm run dev` — open `http://localhost:5173`, navigate to the Results tab.
2. Demo portfolio: 1 consumer (Data centre, 50,000 MWh), 2 generators (Solar PV temperate 25 MW, Wind onshore temperate 10 MW), hourly granularity. Tiles should show 67.33% hourly and annual scores, 0 excess, ~16,335 unmatched.
3. Switch consumer selector between "Whole portfolio" and "Data centre" — values match with a single consumer.
4. Add a second consumer (e.g. Office temperate) with different allocation splits to see different per-consumer scores.
5. Change granularity to Monthly on the Allocation tab, return to Results — granularity text and scores update.
6. Set all allocation cells to 0 — Results shows empty state.
7. Resize browser to 375px width — tiles wrap, charts resize, no horizontal overflow.
8. For automated verification:
   - `npm run typecheck && npm test && npm run lint` for unit tests.
   - `npm run build && npm run test:e2e` for Playwright e2e tests (16 M3 tests + 18 M2 tests).
