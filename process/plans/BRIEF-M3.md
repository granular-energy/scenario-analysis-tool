# Milestone M3 brief: Results tab

Show the engine's results for the current portfolio.

In scope:
- Results header: the matching granularity in words ("Hourly matching, shape preserved within each hour"), a consumer selector (each consumer plus "Whole portfolio"), and four tiles: hourly matching score (large, teal), annual matching score (secondary, labelled "annual (volumetric)"), excess MWh, unmatched MWh. Tooltips explain each.
- Charts (Highcharts, design-system colours, technology colours per generator):
  1. Average 24-hour profile: demand spline, stacked allocated generation by generator, unmatched hatched.
  2. Hourly matching heatmap: 12 months × 24 hours, colour = matched share of demand.
  3. Monthly: stacked matched MWh by generator, excess and unmatched, with the monthly score as a line on a second axis.
  4. Example day picker (default 1 May): hour-by-hour demand vs allocated by generator.
  5. Sankey: generators → consumers → matched / excess, plus unallocated generation.
- Numbers must agree with `src/engine/fixtures/revolt-golden.json` for the demo portfolio and for the golden scenarios when they are built in the UI.
- Empty state when there is no allocation yet. Charts resize for 375px; the Sankey may scroll horizontally.
- Keep the engine run memoised; switching consumer must not re-run the engine.

Out of scope: saving, compare, PDF (M4).
