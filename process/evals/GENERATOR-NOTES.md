# Generator notes — Milestone M7: "Set % of consumption" allocation mode

## What was built

All 25 M7 criteria addressed. Summary of changes:

### Engine (M7.12, M7.13, M7.25)

1. **`src/engine/types.ts`** — Added `AllocationMode` type (`'generator-share' | 'consumption-share'`) and optional `allocationMode` / `consumptionMatrix` fields on `EngineInput`.

2. **`src/engine/score.ts`** — Added `buildConsumptionShareSupplies()` function. In consumption-share mode, each pair's supply = generator normalised shape × (pct/100 × consumer demand total). Generator utilisation reports the assigned volume as `totalGenerationMWh`; `unallocatedMWh` is only what the matching window clips (zero unless hourly matching clips the shape).

### State (M7.1, M7.2, M7.10)

3. **`src/state/portfolioTypes.ts`** — Added `allocationMode` and `consumptionMatrix` to `PortfolioState`. New actions: `SET_ALLOCATION_MODE`, `SET_CONSUMPTION_ALLOCATION`.

4. **`src/state/portfolioReducer.ts`** — All matrix-modifying actions (ADD/REMOVE consumer/generator) manage both matrices. `ALLOCATE_EVENLY` branches: in consumption-share, 100% split across generators per consumer (M7.11). `SET_ALLOCATION_MODE` and `SET_CONSUMPTION_ALLOCATION` handled.

5. **`src/state/demoPortfolio.ts`** — Demo starts in `generator-share` with empty `consumptionMatrix` (zeros).

6. **`src/state/persistence.ts`** — Migration for pre-M7 localStorage: adds defaults for missing `allocationMode`/`consumptionMatrix`.

7. **`src/state/usePortfolio.ts`** — `EMPTY_STATE` updated. Engine invocation passes `allocationMode` and `consumptionMatrix`. `hasAllocation` checks the active matrix.

### IO (M7.17, M7.18)

8. **`src/io/scenarioIO.ts`** — `ScenarioFile` accepts optional `allocationMode`/`consumptionMatrix`. Export includes both. Import defaults to `'generator-share'` / empty matrix when absent.

### UI (M7.3–M7.9, M7.14–M7.16, M7.19–M7.22)

9. **`src/components/allocation/AllocationTab.tsx`** — Segmented toggle (`data-testid="allocation-mode-toggle"`) with two options. Mode-specific description text below.

10. **`src/components/allocation/AllocationMatrix.tsx`** — Uses `activeMatrix` based on mode. In consumption-share: cells edit `consumptionMatrix`, MWh = pct/100 × consumer.annualMWh, row totals show assigned MWh, column totals show `consumer-allocated-pct` with amber warning class when >100%.

11. **`src/components/layout/ScoreStrip.tsx`** — Label changes to "Assigned" and shows engine result totals in consumption-share mode.

12. **`src/components/results/ResultsTab.tsx`** — Prepends "Set % of consumption ·" to results header when in consumption-share mode.

13. **`src/components/compare/AssumptionsTable.tsx`** — Added "Allocation mode" row (first row). Matrix summary uses the active matrix for each scenario's mode.

14. **`src/components/report/pdfReport.ts`** — Cover page shows allocation mode label. Matrix heading changes per mode. `drawAllocationMatrix` uses the active matrix. Comparison PDF assumptions table includes "Allocation mode" row.

15. **`src/styles/app.css`** — `.allocation-mode-toggle` segmented toggle styles (teal active). Warning colour changed from `--ge-error` to `--ge-warning` (#B25E09).

### Tests

16. **`src/engine/__tests__/engine.test.ts`** — Two new tests: consumption-share 15% of 50k MWh = 7,500 MWh solar shape; generator utilisation reports the assigned volume as generation, with surplus only from clipping.

17. **`src/io/__tests__/scenarioIO.test.ts`** — Backward-compatible import test (pre-M7 file defaults to generator-share).

18. **`tests/e2e/m7-consumption-share.spec.ts`** — 20 Playwright tests covering M7.1–M7.22 (persistence, toggle, cell math, warnings, mode switching, allocate evenly, score strip, results header, Sankey, scenario save, compare assumptions, PDF download, mobile viewport, reload persistence).

19. **Updated test helpers** — `emptyState()` in reducer test and `makeSavedScenario` in scenario store test include new required fields.

## Test results

- `npm run typecheck` — 0 errors
- `npm test` — 156 unit tests pass (16 files)
- `npm run lint` — 0 errors
- `npm run build` — succeeds

## What could not be finished

Nothing — all 25 criteria addressed.

## Notes for the evaluator

- **Demo portfolio**: Starts in generator-share mode with the same golden-fixture results. The consumption matrix is all zeros. Switching to consumption-share mode does not affect any existing tests or scores.
- **Testing the toggle**: Navigate to Allocation tab → click "Set % of consumption" → cells now edit the consumption matrix. Enter 15 in a cell for the demo's Data centre (50,000 MWh) to see the 7,500 MWh annotation.
- **Allocate evenly**: In consumption-share with the demo portfolio (1 consumer, 2 generators), both cells become 50%.
- **Over-allocation warning**: Set both generators to 60% each — the consumer column total shows 120% with amber styling and a tooltip about excess energy.
- **Sankey**: In consumption-share mode a "Surplus" node appears only when hourly matching clips the assigned shape, so the diagram always adds up to the assigned total shown in the score strip.
- **Backward compatibility**: Importing a pre-M7 scenario JSON (no `allocationMode` field) loads as generator-share with an empty consumption matrix. All golden fixture tests pass unchanged.
- **Sign-up flag**: E2e tests set `localStorage.setItem('scenario-tool.signedUp', new Date().toISOString())` after `localStorage.clear()`.
- **Mobile**: The allocation-mode toggle wraps to a column layout at narrow widths (375px tested) with no horizontal overflow.
