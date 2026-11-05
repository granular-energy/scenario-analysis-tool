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

Replace the one-liners with a short panel per option that states what is compared, what constraint applies, and what the result shows. Copy (edit for fit, keep the meaning):

- **Hourly** — *What happens:* each hour of the year is matched on its own. *Constraint:* generation can only cover consumption in the same hour; surplus in one hour cannot cover a shortfall in another. *Result:* the hourly score and the annual score are the same number. This is 24/7 hourly matching, the strictest standard.
- **Monthly** — *What happens:* each calendar month is matched as a block, as in a monthly-matched supply contract. *Constraint:* the volume allocated in a month is capped at that month's consumption, and it keeps the generator's own hourly shape; it cannot be moved into the hours that happen to need it. *Result:* the annual score shows how much of consumption was covered on paper; the hourly score shows how much of that was actually covered hour by hour.
- **Annual** — *What happens:* the whole year is matched as one block, as with annual certificates (GoOs, REGOs). *Constraint:* allocation is capped at annual consumption and keeps the generator's shape. *Result:* the annual score can reach 100 % while the hourly score shows the real hour-by-hour coverage behind the claim.

Add one sentence above the options: "In every method, generation is allocated to consumers in the order of largest generator first, up to what the consumer needs in the matching window; nothing is optimised. This is how the Granular platform allocates." Keep the Results header line that names the chosen method.

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

## Out of scope
Scenarios, Compare, PDF, HubSpot (M4). New charts.
