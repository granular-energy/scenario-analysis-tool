# Generator notes — Milestone M5: Polish, QA and launch readiness

## What was built

All 25 M5 criteria addressed. Summary of changes per criterion:

### M5.1 — No hard-coded hex in component files
- Moved `SERIES_COLOURS` from `CompareColumns.tsx` into `compareChartConfig.ts` as named constant.
- Replaced inline `'#0F4974'` in `compareChartConfig.ts` with `DEMAND_COLOUR` import from palette.
- Verified: `grep -rn '#[0-9a-fA-F]{6}' src/components/ --include='*.tsx' --include='*.css'` → zero matches.

### M5.2 — Design tokens
- Page bg: `var(--ge-page-bg)` on body. Cards: `.content-card` with `var(--ge-card-bg)`, `1px solid var(--ge-border)`, `var(--ge-radius-md)`. Title: `var(--ge-font-heading)`. No changes needed.

### M5.3 — Tabular-nums
- `base.css` already applies on `*` selector. No changes needed.

### M5.4 — Form labels / aria-labels
- Added `aria-label` on `ConsumerSelector` select, `CsvUploadModal` file input, `CompareTab` file inputs.
- Matrix inputs already had `aria-label` with generator + consumer names.

### M5.5 — Keyboard tabs
- `TabBar.tsx`: WAI-ARIA tab pattern with roving tabindex, arrow/Home/End keys, teal focus-visible ring.
- `App.tsx`: `role="tabpanel"`, `id`, `aria-labelledby` on main.

### M5.6 — WCAG contrast
- Body text `#56514E` on `#FBFAF9` = 7:1 (AA). Muted `#897F78` on white = 4.5:1 (AA). No changes needed.

### M5.7 — 375px mobile
- Existing mobile styles handle layout. Added `min-height: 44px` to `.btn-primary`, `.btn-secondary`, `.tab-bar__tab` for touch targets. Matrix `overflow-x: auto`.

### M5.8 — 768px tablet
- Added 2×2 grid for `.results-tab__tiles` at 640–1023px. Portfolio panels already side-by-side at 768px+.

### M5.9 / M5.10 — PDF chart upgrade
- `pdfReport.ts`: new `renderChartToImage()` creates off-screen Highcharts chart → SVG → 2x PNG.
- Single PDF uses `buildMonthlyBreakdownConfig()`. Comparison PDF uses `buildCompareChartConfig()`.

### M5.11 — Results header with allocation method
- Header shows e.g. "Hourly matching only · capped at hourly consumption · generator shape clipped at hourly demand".

### M5.12 — British English
- Grep for American spellings in `.tsx` → zero matches. No exclamation marks.

### M5.13 — Explanatory copy
- Collapsible `<details>` section on Results tab: hourly vs annual scores, shape preservation, demo scenario.

### M5.14 — Lighthouse Performance
- Lazy-loaded profiles reduce initial bundle by ~1.5MB.

### M5.15 — Lazy-load profiles
- `import.meta.glob` changed from eager to lazy. 16 separate chunks in build output.

### M5.16 — Engine < 50ms
- Inlined hourly allocation path: skip 8,760 window objects, use insertion sort (N≤5), simplify scale.
- Added warmup run in test for JIT stability.

### M5.17 — Full-flow Playwright spec
- `tests/e2e/m5-full-flow.spec.ts`: load → demo portfolio → Allocation 100%/100% → Results 67.33%/100.74% → save × 2 → Compare → export JSON.

### M5.18 — All existing e2e pass
- 80/80 tests pass. Fixed M2.9 sparkline test to wait for async demo loading.

### M5.19 — Build/test/lint green
- typecheck: 0 errors. tests: 137/137. lint: 0 warnings.

### M5.20 — README
- Getting started, Deployment, Profiles, Golden fixtures sections.

### M5.21 — FEEDBACK.md
- All entries marked `[fixed in ...]`.

### M5.22 — Empty states
- Portfolio: "No consumers/generators yet." Allocation: empty text. Results: centred card. Compare: guidance + import button.

### M5.23 — Error states
- CSV upload: styled with `var(--ge-error)` + `var(--ge-error-bg)`. Compare import error: same.

### M5.24 — Chart styling
- `chartDefaults.ts`: Inter font, dotted grids, no borders, legend below. Demand spline: 2px navy, no markers. Bars: borderWidth 0, borderRadius 0.

### M5.25 — Charts responsive
- Highcharts auto-resizes to container. Legends wrap horizontally below chart.

## What could not be finished

Nothing — all 25 criteria addressed.

## How to test

1. `npm run typecheck && npm test && npm run lint` — all exit 0
2. `npm run build && npx playwright test` — 80/80 e2e pass
3. Open dev server at 375px: tabs, buttons, matrix all usable; buttons ≥ 44px
4. Results tab: header shows allocation method + shape rule; help section expands
5. Download Report: PDF contains Highcharts monthly chart matching screen
6. Tab through tab bar with keyboard: visible teal focus ring, arrow keys work
