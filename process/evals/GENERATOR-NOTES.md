# Generator notes -- M4 Compare tab UI

## What was built

### 1. `src/components/compare/CompareTab.tsx` -- Main container (< 150 lines of logic)

- Uses `useState` for selected scenario IDs (up to 4), import error, rename state.
- Loads saved scenarios from localStorage via `loadScenarios()` on mount; re-syncs on window focus.
- Shows guidance text with `data-testid="compare-guidance"` when fewer than 2 scenarios are saved.
- Shows a scenario picker with checkboxes (max 4 selectable), `data-testid="compare-picker"`.
- Rename/Delete buttons for each saved scenario. Inline rename input with blur/Enter confirmation.
- "Import scenario" button (`data-testid="import-scenario-btn"`) opens a hidden file input for `.json`.
- Import validates via `validateScenarioFile()`, runs the engine to get results summary, then saves.
- When 2+ scenarios selected: renders CompareColumns, CompareChart, AssumptionsTable, ConsumerScoreTable.
- "Download comparison PDF" button (`data-testid="download-comparison-pdf"`) logs to console (PDF wired separately).
- Uses `useMemo` to derive `validSelectedIds` from raw selectedIds, avoiding setState-in-effect lint warning.

### 2. `src/components/compare/CompareColumns.tsx` -- Tile columns

- One column per selected scenario showing: name, hourly score, annual score, excess MWh, unmatched MWh.
- Uses `ScenarioResultsSummary` from saved scenario (no re-computation).
- Each column has a coloured top border from `--ge-series-1..4` palette.
- `data-testid="compare-columns"`.

### 3. `src/components/compare/CompareChart.tsx` -- Monthly score overlay chart

- Highcharts spline chart with one series per scenario.
- Uses the existing `Chart` wrapper and `mergeDefaults` from Results charts.
- Colours: `#00988b`, `#e9a23b`, `#0f4974`, `#ab80cc` (matching tokens.css `--ge-series-1..4`).
- X-axis: 12 months (Jan-Dec). Y-axis: 0-100%.
- `data-testid="compare-chart"`.

### 4. `src/components/compare/compareChartConfig.ts` -- Pure chart config builder

- `buildCompareChartConfig(input)` returns Highcharts options.
- Uses `mergeDefaults()` to inherit the standard Granular chart styling (Inter font, dotted grids, etc.).
- Unit tested in `__tests__/compareChartConfig.test.ts` (5 tests).

### 5. `src/components/compare/AssumptionsTable.tsx` -- Assumptions diff table

- Rows: Consumers, Generators, Matrix, Allocation method.
- Columns: one per selected scenario.
- Cells that differ between scenarios get CSS class `assumptions-table__cell--differs` (teal-100 background, bold).
- Uses `granularityLabel()` to display the allocation method name.
- Uses "Allocation method" as the row label (M4.22).
- Wrapped in `.matrix-scroll` for horizontal scrolling on mobile.
- `data-testid="assumptions-table"`.

### 6. `src/components/compare/ConsumerScoreTable.tsx` -- Per-consumer scores

- Re-runs the engine for each scenario via `useMemo` to get per-consumer `ConsumerResult`.
- Builds a union of all consumer IDs across scenarios.
- Shows hourly and annual scores for each consumer in each scenario.
- Uses React `Fragment` for multi-column cells per scenario.
- `data-testid="consumer-score-table"`.

### 7. `src/styles/app.css` -- Compare tab CSS

- All new styles use `var(--ge-*)` tokens, never hard-coded colours.
- At 375px viewport: columns stack vertically via `grid-template-columns: 1fr`.
- Assumptions table scrolls horizontally via `.matrix-scroll`.
- All buttons have minimum 44px touch target (`min-height: 44px`).
- Styling for picker items, rename inputs, error messages, section titles.

### 8. `src/App.tsx` -- Wiring

- Replaced the Compare placeholder with `<CompareTab />`.
- Imported `CompareTab` from `./components/compare/CompareTab`.

### 9. `tests/e2e/m4-compare.spec.ts` -- Playwright e2e tests (7 tests)

- M4.7: Guidance text when < 2 scenarios saved.
- M4.7: Picker visible when 2+ scenarios saved.
- M4.9: Chart renders with 2 scenarios selected.
- M4.10: Assumptions table shows portfolio details.
- M4.11: Differing cells are highlighted, identical cells are not.
- M4.16: Import scenario button is accessible.
- M4.17: At 375px viewport, columns stack vertically.
- Tests inject scenarios into localStorage directly for reliability.

## Verification

- `npm run typecheck` passes (no errors).
- `npm test` passes (14 test files, 137 tests, all green -- includes the 5 new compare chart config tests).
- `npm run lint` passes (no warnings).
- No changes to `revolt-golden.json` or any engine files.
- No `any` types used.
- British English in UI copy. No exclamation marks.
- "Allocation method" used in all new user-facing copy (not "matching granularity").

## What the evaluator should know

- **To test the Compare tab**: Navigate to the Results tab first, save 2+ scenarios (a Save Scenario button must exist on Results -- this is built by a parallel agent). Then navigate to Compare, check 2+ checkboxes, and the comparison content renders.
- **For quick testing without the Save button**: Inject scenarios into localStorage as the e2e tests do. The key is `sat-v3-scenarios` and the value is a JSON array of `SavedScenario` objects.
- **Demo portfolio golden numbers**: Hourly score 67.33%, annual score 100.74%, excess 0 MWh, unmatched ~16,335 MWh.
- **PDF download button**: Logs to console only. PDF generation is wired up by a separate agent.
- **Import scenario**: The "Import scenario" button on Compare tab opens a file picker for `.json` files. After import, the scenario appears in the picker.
- **Responsiveness**: At 375px, columns stack, tables scroll horizontally, all interactive elements maintain 44px minimum touch targets.
