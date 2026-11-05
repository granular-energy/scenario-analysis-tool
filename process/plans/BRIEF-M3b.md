# Milestone M3b brief: review changes to Portfolio, Allocation and Results

Changes requested by Toby after reviewing M2 and M3 on 5 Nov 2026, plus the open low-severity items in `process/FEEDBACK.md`. This milestone changes behaviour that M2/M3 tests assert, so update those tests rather than deleting them.

## 1. Generators are sized by annual MWh, not MW

- The generator card's sizing field becomes **Annual generation (MWh)**, pre-filled from the registry as `defaultCapacityMW × capacityFactor × 8760` (e.g. solar PV temperate: 20 × 0.11 × 8760 = 19,272 MWh).
- Below the field show the implied capacity as a hint: "≈ 20 MW at a 0.11 capacity factor". The hint is informational only.
- Engine input is unchanged (hourly MWh = shape × annual MWh). Golden fixtures are unchanged; the demo portfolio must still give 67.33 % at hourly granularity, so the demo generators are now solar 24,090 MWh and wind 26,280 MWh.
- Persisted state from the previous version (capacityMW) must migrate on load without losing the portfolio.

## 2. Allocation matrix shows volumes and accepts % or MWh

- Row headers show each generator's name and its **annual generation MWh**; column headers show each consumer's name and its **annual consumption MWh**.
- Each cell shows both the **%** of the generator and the equivalent **MWh**. The user can type either: a toggle on the matrix ("Enter as: % / MWh") switches which one is editable; the other is computed and displayed. Internally the matrix stays in percent; MWh entry converts to percent of that generator's annual MWh.
- Row total shows allocated MWh and % of the generator (warn above 100 %). Column total shows allocated MWh and % of the consumer's annual consumption (this can legitimately exceed 100 %; no warning, but show it).
- "Allocate evenly" keeps working in both modes.

## 3. Matching granularity needs real explanations

Each method aims for 100 % matching at its own resolution; the hourly score then shows what is left when you look hour by hour. Replace the one-liners with a short panel per option. Copy (edit for fit, keep the meaning):

- **Hourly matching only** (option label; internal value stays `hourly`) — Aims for 100 % matching in every hour. Allocation in each hour is capped at that hour's consumption, so there is never over-allocation. The hourly and annual scores are the same number. This is 24/7 hourly matching, the strictest standard.
- **Monthly matching target** (internal value `monthly`) — Aims for 100 % matching in every calendar month, as close as supply allows. Allocation in each month is capped at that month's consumption and keeps the generator's own hourly shape, so within the month some hours are over-supplied (excess) and others fall short. The hourly score shows how much of a 100 %-monthly-matched position holds hour by hour.
- **Annual matching target** (internal value `annual`) — Aims for 100 % matching over the whole year, as with annual certificates (GoOs, REGOs). Allocation is capped at annual consumption and keeps the generator's shape. The annual score can reach 100 % while the hourly score shows how much of that claim holds hour by hour.

Add one sentence above the options: "In every method, generation is allocated to each consumer largest generator first, up to the consumer's consumption in the matching window, keeping each generator's hourly shape. This is how the Granular platform allocates." The option labels are exactly "Hourly matching only", "Monthly matching target" and "Annual matching target", and the same labels are used wherever the method is named (Results header, score strip tooltip, later reports).

## 4. Sankey: fix and make it make sense

Reproduced problems (see `process/evals/scratch/sankey-portfolio.png`, `sankey-consumer-2.png`):
- Switching the consumer selector leaves stale nodes from the previous view and draws every label twice. Recreate the chart when the data set changes (new React key or `immutable`), and turn off link data labels so only node labels render.
- In the whole-portfolio view "Unallocated" sits in the consumer column and reads as a consumer; small consumers get labels that collide.
- In the per-consumer view "Unallocated" shows the generator's unallocated volume across all consumers, so the flows do not balance.

Required design:
- Three columns, left to right: **Generators → Consumers → Outcomes**. Outcomes are **Matched**, **Excess** (allocated but above demand in the hour) and **Surplus generation** (never allocated). Surplus flows go generator → Surplus and the Surplus node lives in the outcomes column, not the consumer column.
- Per-consumer view shows only that consumer's share of each generator; surplus is omitted (it is a portfolio-level concept) and the header says so.
- Every link and node has a tooltip with MWh and % of the source. Node labels never overlap: use Highcharts' `nodePadding`/`minLinkWidth` and label `allowOverlap: false`, and label small nodes on hover only if needed.
- Flows must balance: Σ generator outflows = Σ generation; Σ consumer inflows = Σ consumer outflows. Add a unit test on the builder that asserts this for a 2-consumer, 3-generator case with partial allocations and at all three granularities.

## 5. Open FEEDBACK.md items

Fix the three items logged on 2 Nov (example-day picker shows a real year; Sankey "Unallocated" wording, superseded by section 4; monthly chart y-axis label rotated) and mark them fixed.

## 6. Bar charts must stack like the platform's "Demand and allocation over time"

Reference screenshot: `process/research/reference-platform-demand-allocation-chart.webp`. In all three bar charts (average 24-hour profile, monthly breakdown, example day) the stack order from the bottom is:
1. matched energy per generator, in the technology's allocated colour;
2. excess per generator, in the technology's lighter "excess" colour, labelled "<name> in excess";
3. unmatched demand on top, as the hatched pattern;
with the demand spline (`#0F4974`) drawn over the stack. Today unmatched is at the bottom, which is wrong. Legend order follows the stack. Excess series are omitted when their total is below 0.01 MWh (hourly granularity).

## Out of scope
Scenarios, Compare, PDF, HubSpot (M4). New charts.
