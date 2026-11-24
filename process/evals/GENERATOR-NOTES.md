# Generator notes -- M5.9/M5.10: Highcharts-rendered PDF charts

## What was built

### Highcharts off-screen rendering (`src/components/report/pdfReport.ts`)

Replaced the two canvas-drawn chart functions (`drawMonthlyBarChart` and `drawMonthlyScoreLineChart`) with Highcharts-rendered images that use the exact same config builders as the on-screen charts.

**New helper: `renderChartToImage(options, width, height)`**
- Creates a hidden off-screen `<div>` positioned at -9999px
- Renders a full Highcharts chart into it using `Highcharts.chart()`
- Extracts SVG from the renderer's root `<svg>` element via `svgElement.outerHTML` (avoids needing the exporting module)
- Converts SVG to PNG via `Blob` -> `URL.createObjectURL` -> `Image` -> `canvas.toDataURL()`
- Uses 2x resolution scaling for retina-quality output
- Cleans up the off-screen container and chart instance

**New helper: `buildMonthlyBreakdownInputFromResult(result, state)`**
- Aggregates per-consumer generator contributions into portfolio-level monthly totals (mirrors the aggregation logic from `ResultsTab`)
- Builds the `MonthlyBreakdownInput` with generator names, technologies, matched/excess monthly data -- identical to what the on-screen chart receives

**Single scenario PDF (M5.9):**
- Now calls `buildMonthlyBreakdownConfig()` (from `src/components/results/charts/monthlyBreakdownConfig.ts`) with the same input shape used on-screen
- Renders via `renderChartToImage()` at 800x400px
- Result: PDF monthly breakdown chart has technology colours, hatched unmatched bars, monthly score spline on secondary axis -- matching the screen exactly

**Comparison PDF (M5.10):**
- Now calls `buildCompareChartConfig()` (from `src/components/compare/compareChartConfig.ts`) with the same input shape used on-screen
- Renders via `renderChartToImage()` at 800x350px
- Result: PDF comparison chart has spline lines with scenario colours and markers -- matching the screen exactly

### What was removed

- `drawMonthlyBarChart()` -- old canvas-drawn simplified bar chart with single teal colour
- `drawMonthlyScoreLineChart()` -- old canvas-drawn line chart with manual axes/legend
- `TEAL` constant (no longer needed; technology colours come from the config builders)
- `MONTH_LABELS` array (no longer needed; month names come from the config builders)

### Imports added

- `Highcharts` from `'highcharts'`
- Side-effect imports for `highcharts-more`, `heatmap`, `sankey`, `pattern-fill` modules (ensures pattern-fill is available for the hatched unmatched bars)
- `buildMonthlyBreakdownConfig` and `MonthlyBreakdownInput` from the monthly breakdown config builder
- `buildCompareChartConfig` from the compare chart config builder

## Technical notes

- The `renderChartToImage` function uses `chart.renderer.box` (the root SVG element) rather than `chart.getSVG()`. This avoids needing to import the Highcharts exporting module while achieving the same result -- the rendered SVG already contains everything needed.
- The chart is rendered with `animation: false`, `enableMouseTracking: false`, `tooltip.enabled: false` to suppress any interactive features that are irrelevant for static export.
- Chart background is set to `#ffffff` (white) rather than transparent to ensure the PDF image has a solid background.
- The Highcharts modules (pattern-fill, etc.) are imported as side effects at the top of the file. Since the PDF generation only runs after the user has viewed the Results tab (where `Chart.tsx` already registers the same modules), these imports serve as a safety net.

## Verification

- `npm run typecheck`: passes (0 errors)
- `npm run lint`: passes (0 warnings)
- `npm test`: 136 of 137 tests pass; the one failure is a pre-existing timing flake (`runs a 5x5 hourly portfolio quickly` -- 54ms vs 50ms threshold) unrelated to this change

## How to test

1. Add consumers and generators to the portfolio (use library profiles or the demo data)
2. Set allocations on the Allocation tab
3. Go to the Results tab, verify the monthly breakdown chart renders on-screen
4. Click "Download report" to generate the single-scenario PDF
5. Open the PDF and check the monthly breakdown chart matches the on-screen version (technology colours, hatched unmatched bars, score spline line, legends, axis labels)
6. Save 2+ scenarios, go to the Compare tab
7. Click "Download comparison PDF" to generate the comparison PDF
8. Open the PDF and check the monthly scores line chart matches the on-screen Compare chart (spline lines with scenario colours, markers, axis formatting)
