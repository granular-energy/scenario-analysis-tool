# Generator notes — Milestone M3c

## What was built

### Engine: as-produced matching method (M3c.1–M3c.5)
- **Type widened**: `MatchingGranularity` in `src/engine/types.ts` now includes `'as-produced'` as a fourth union member.
- **Allocation path**: `allocateToConsumer` in `src/engine/allocate.ts` has a dedicated `'as-produced'` code path that assigns each generator's full matrix-share supply hour by hour with no cap at demand. No `min(available, remaining)` step — the consumer receives everything.
- **Scoring**: The existing `summarise` function in `score.ts` correctly computes `matched(h) = min(allocated(h), demand(h))`, `excess(h) = allocated(h) - matched(h)`, `unmatched(h) = demand(h) - matched(h)` from any allocation series, so it handles as-produced without changes.
- **Golden fixtures**: Removed the `SUPPORTED_GRANULARITIES` guard and `TODO(M3c)` comment from `golden.test.ts`. All as-produced fixture scenarios now run and pass within 1e-6 relative tolerance.
- **Existing tests**: All 3 existing granularity golden tests (hourly, monthly, annual) still pass unchanged. No fixture values altered.
- **Engine purity**: `src/engine/` has no React, DOM, or component/state imports.

### Granularity selector — Allocation tab (M3c.6–M3c.9)
- **"How allocation works" note**: Added below the method options with `data-testid="how-allocation-works"`. Contains the exact verbatim text: "In all four methods a generator's allocation follows its own hourly output shape — it is never moved into the hours that happen to need it. The methods differ only in the window within which allocation is capped at consumption: every hour, every month, the whole year, or not at all."
- **Fourth option**: Label is exactly "As produced (no cap)" with the specified description text about pay-as-produced PPA.
- **Updated descriptions**: All four options have descriptions that state the cap window and shape rule. Hourly mentions capping at each hour's consumption. Monthly mentions capping at monthly consumption with shape preserved. Annual mentions capping at annual consumption with shape preserved.
- **Method descriptions fixed** (FEEDBACK.md regression): Replaced drifted M3b descriptions with the agreed copy from BRIEF-M3b section 3, extended with BRIEF-M3c cap-window phrases.

### Results header and method context (M3c.10–M3c.14)
- **Full header line**: Results tab header now shows `"label · cap rule · shape rule"`. Exact strings:
  - Hourly: "Hourly matching only · capped at hourly consumption · no over-allocation possible"
  - Monthly: "Monthly matching target · allocation capped at monthly consumption · generator shape preserved"
  - Annual: "Annual matching target · allocation capped at annual consumption · generator shape preserved"
  - As-produced: "As produced (no cap) · no cap · generator shape preserved"
- **Shape-preserved tooltip**: The phrase "shape preserved" (in both the Results header and Allocation tab descriptions) is rendered as an `<abbr>` element with `title` and `aria-label` attributes. The tooltip says: "A generator's allocation follows its own hourly output shape and is not redistributed into other hours. The allocated volume in each hour is proportional to the generator's actual output in that hour."
- **`granularityLabel` helper**: Returns "As produced (no cap)" for `'as-produced'`. New `granularityInfo()` and `granularityHeaderLine()` helpers also added.

### Demo portfolio with as-produced (M3c.15–M3c.16)
- With the demo portfolio (Data Centre 50,000 MWh; Solar 24,090 MWh at 100%; Wind 26,280 MWh at 100%), selecting "As produced (no cap)" shows results that match the as-produced golden fixture values.
- At as-produced granularity, the excess tile shows a non-zero value (since generation is not capped at demand), confirming the uncapped allocation behaviour.

### Build and type safety (M3c.17–M3c.18)
- `npm run build`, `npm run typecheck`, and `npm run lint` all pass with zero errors.
- All `Record<MatchingGranularity, ...>` maps and switch/case blocks handle `'as-produced'`.
- The `windowsFor` function uses `Exclude<MatchingGranularity, 'as-produced'>` to maintain exhaustive switch coverage.

### Mobile (M3c.19)
- At 375px viewport: all four granularity options visible without horizontal overflow. The "How allocation works" note and descriptions are readable. The Results header wraps gracefully (smaller font, word-wrap enabled).

### FEEDBACK.md regression fixes
- **Bar chart stacking order**: Fixed in all three bar charts (average day, example day, monthly breakdown). Stack order is now: matched per generator → unmatched (hatched) → excess per generator → demand spline on top. Previously unmatched was at the bottom.
- **Sankey node labels**: Fixed by replacing the `dataLabels` array with a single object using `nodeFormat: '{point.name}'`, removing `nodeFormatter: undefined`, and removing the `plotOptions.sankey.dataLabels.allowOverlap` override. Labels now render on all nodes, with `crop: false` and `overflow: 'allow'` so small nodes get external labels.
- **Method descriptions**: Already fixed as part of the main M3c work (see above).

## Files changed

### Engine
- `src/engine/types.ts` — Added `'as-produced'` to `MatchingGranularity` union
- `src/engine/allocate.ts` — Added as-produced allocation path; narrowed `windowsFor` type
- `src/engine/__tests__/golden.test.ts` — Removed `SUPPORTED_GRANULARITIES` guard
- `src/engine/__tests__/engine.test.ts` — Added as-produced unit tests

### Components
- `src/components/allocation/GranularitySelector.tsx` — Four options with updated descriptions, "How allocation works" note, shape-preserved tooltips
- `src/components/results/ResultsTab.tsx` — Full header line with shape-preserved tooltip
- `src/components/results/granularityLabel.ts` — Added `granularityInfo()`, `granularityHeaderLine()`, `SHAPE_PRESERVED_TOOLTIP`

### Charts
- `src/components/results/charts/averageDayConfig.ts` — Fixed series order
- `src/components/results/charts/exampleDayConfig.ts` — Fixed series order
- `src/components/results/charts/monthlyBreakdownConfig.ts` — Fixed series order
- `src/components/results/charts/sankeyConfig.ts` — Fixed node label rendering

### Styles
- `src/styles/app.css` — Added `.granularity-selector__note`, `.granularity-selector__shape-tip`, `.results-tab__shape-tip`, and mobile styles

### Tests
- `src/components/results/__tests__/granularityLabel.test.ts` — Tests for all four granularities, info, header line, tooltip
- `src/components/results/charts/__tests__/sankeyBalance.test.ts` — Added as-produced to test list
- `tests/e2e/m3c-as-produced.spec.ts` — 12 new e2e tests covering all M3c criteria
- `tests/e2e/m3b-enhancements.spec.ts` — Updated for four options and expanded header

## What was not finished

All 19 criteria in the M3c contract were implemented.

## How to test

1. `npm run dev` — open `http://localhost:5173`.
2. **As-produced method**: Navigate to the Allocation tab. Four radio options visible; the fourth is "As produced (no cap)". Select it, navigate to Results — scores and tiles update. The excess tile shows a non-zero value (unlike hourly granularity which shows 0).
3. **"How allocation works" note**: Below the four options, a teal-tinted box explains shape preservation and the four cap windows.
4. **Shape-preserved tooltip**: Hover over "shape preserved" in the monthly or annual option description, or in the Results header — a tooltip appears explaining the concept.
5. **Results header**: Shows full context line, e.g. "Monthly matching target · allocation capped at monthly consumption · generator shape preserved".
6. **Bar chart stacking**: Switch to monthly granularity — matched is at bottom, hatched unmatched in the middle, pastel excess on top, demand line at the matched+unmatched boundary.
7. **Sankey labels**: All nodes show their names. Hover for MWh tooltips.
8. **Mobile**: Chrome DevTools → 375×812 — all four options and note visible without overflow; Results header wraps.
9. **Automated**: `npm run typecheck && npm test && npm run lint` (97 unit tests, all pass). `npm run build && npm run test:e2e` (62 e2e tests, all pass).
