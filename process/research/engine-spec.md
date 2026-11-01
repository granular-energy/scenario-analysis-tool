# Matching engine specification

The engine reproduces the Granular platform's **as-consumed** allocation (revolt `CoreAllocationEngine` with `GreedyAllocationStrategy`) for a portfolio of consumers and generators joined by a percentage matrix. Reference results live in `src/engine/fixtures/revolt-golden.json`; the engine must reproduce them to 1e-6 relative tolerance.

## 1. Inputs

```ts
type HourlySeries = readonly number[]        // length 8760, MWh per hour

interface Consumer   { id: string; demandMWh: HourlySeries }
interface Generator  { id: string; generationMWh: HourlySeries }
type AllocationMatrix = Record<generatorId, Record<consumerId, number>>   // percent, 0–100; column total per generator ≤ 100
type MatchingGranularity = 'hourly' | 'monthly' | 'annual'

interface EngineInput { consumers: Consumer[]; generators: Generator[]; matrix: AllocationMatrix; granularity: MatchingGranularity }
```

## 2. Algorithm

Consumers are independent: each generator's output is pre-split by the matrix, so consumer *c* sees supply `S_gc(h) = pct[g][c]/100 × G_g(h)` and never competes with other consumers. Run the following once per consumer.

For each **matching window** W (every hour, every calendar month, or the whole year):

1. `remaining = Σ_{h∈W} D_c(h)` (the consumer's demand in the window).
2. Order the generators by **descending** supply in W (`Σ_{h∈W} S_gc(h)`); ties keep input order.
3. For each generator *g* in that order:
   - `available = Σ_{h∈W} S_gc(h)`; skip if `available ≤ 0.001` MWh (platform threshold).
   - `q = min(available, remaining)`; skip if `q ≤ 0.001`.
   - **Shape preservation:** `A_gc(h) = q × S_gc(h) / available` for every `h ∈ W` — the allocated volume follows the generator's own hourly shape inside the window; it cannot be concentrated into the hours that happen to match.
   - `remaining -= q`.
4. Hours outside any generator's allocation get 0.

**Hourly granularity, two passes.** The platform's data is half-hourly, so with hourly matching each hour is served in two half-hour passes: in each pass every generator offers half its hour, largest first, up to the remaining demand. The hour's total allocation is the same as a single pass, but the split between generators interleaves (e.g. supply 10 and 8 against demand 9 gives 5 + 4, not 9 + 0). The engine reproduces this so per-generator contributions match the platform.

Per hour, per consumer: `allocated(h) = Σ_g A_gc(h)`, `matched(h) = min(allocated(h), D_c(h))`, `excess(h) = allocated(h) − matched(h)`, `unmatched(h) = D_c(h) − matched(h)`.

With hourly granularity this collapses to the familiar per-hour `min()`. With monthly or annual granularity, allocated volume lands in some hours above demand (excess) and leaves others short, which is exactly the gap between annual/monthly and hourly matching that the tool exists to show.

## 3. Outputs

Per consumer and for the whole portfolio (sums over consumers):

- `hourlyScore = Σ matched / Σ demand × 100`
- `annualScore = Σ allocated / Σ demand × 100` (can exceed 100)
- `totalDemandMWh`, `totalAllocatedMWh`, `totalMatchedMWh`, `totalExcessMWh`, `totalUnmatchedMWh`
- `monthlyScores[12]`, `monthlyMatchedMWh[12]`, `monthlyExcessMWh[12]`, `monthlyUnmatchedMWh[12]`
- per generator: `allocatedMWh` (hourly), `monthlyAllocatedMWh[12]`, `totalAllocatedMWh`, and its **contribution to matched energy**: `matchedShare_g(h) = matched(h) × A_gc(h) / allocated(h)` (pro-rata when several generators supply the same hour)
- hourly arrays for charts: `demandMWh`, `allocatedMWh`, `matchedMWh`, `excessMWh`, `unmatchedMWh`, `hourlyMatchPct` (0 where demand is 0)
- generator **utilisation**: `Σ_c A_gc / Σ_h G_g` and the unallocated remainder (for the Sankey)

## 4. Typical year and uploads

- 8,760 hourly slots: index `h = dayOfYear×24 + hour`, months at the standard non-leap boundaries (744, 672, 744, 720, …). Slot 0 is 1 Jan 00:00–01:00.
- Library profiles are normalised shapes (sum = 1). Sizing: consumer `demand = shape × annualMWh`; generator `generation = shape × capacityMW × capacityFactor × 8760` with the capacity factor from `src/data/profiles/registry.json`.
- Uploaded profiles are actual MWh. Parsing (in `src/io`): detect resolution (hourly or half-hourly, by median timestamp gap); interpret timestamps in the user-chosen timezone (default UTC; auto-detected when offsets are present); convert to local clock time; sum half-hours into hours; map each hour onto its typical-year slot by (month, day, hour); merge the duplicated DST hour (sum) and fill the missing one (average of neighbours); drop 29 Feb with a notice; require every one of the 8,760 slots to be filled from exactly 12 contiguous months of data, otherwise reject with a message that names the gap.
- Units: kWh, MWh, kW (average) or MW (average); kW/MW are converted to energy per interval.

## 5. Performance

A 5-consumer × 5-generator portfolio at hourly granularity is ≤ 5 × 5 × 8,760 operations; target < 50 ms in the browser. Use plain `Float64Array`/number arrays and loops, no per-hour object allocation.

## 6. Why these choices (for the evaluator)

- "Largest generator first" and the 0.001 MWh thresholds come from the platform engine; do not "improve" them.
- The platform pairs each matching granularity with the shape-preservation resolution of the same length (hourly ↔ half-hourly, monthly ↔ monthly, annual ↔ annual). Pairing a shorter preservation window with a longer matching window would fill the window chronologically rather than by shape, which is not what the tool should show.
- Consumers never compete for supply because the matrix pre-splits every generator; this is deliberate and keeps results explainable.
