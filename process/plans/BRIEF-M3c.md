# Milestone M3c brief: "As produced" method and shape-preservation explanation

Follows M3b. Two changes from Toby's review on 5 Nov 2026.

## 1. Fourth matching method: As produced (no cap)

- Add `'as-produced'` to `MatchingGranularity` in the engine. Allocation to each consumer is its full matrix share of every generator's output, hour by hour, with no cap at consumption in any window. Excess appears wherever allocated generation exceeds demand in the hour; unmatched wherever it falls short. Scores, excess and unmatched are computed exactly as for the other methods.
- The option label is **"As produced (no cap)"**. Copy: "The consumer receives its full share of each generator's output in every hour, with nothing held back. This is what a pay-as-produced PPA delivers. Excess appears wherever generation exceeds consumption in the hour."
- Golden fixtures: regenerate `src/engine/fixtures/revolt-golden.json` with an `as-produced` result set for every scenario, produced by revolt's `AsProducedModel` (`SupplyDrivenStrategy`), and add parity tests like the existing ones. The fixture generator lives in the revolt repo at `working_dir/scenario_tool/generate_golden_fixtures.py`; the human runs it and commits the new fixture file before this milestone starts, so the generator agent only has to add the tests and engine branch. Do not edit the fixture file by hand.
- All existing tests and golden cases for the three capped methods must still pass unchanged.

## 2. Say whether shape preservation is used

Every method allocates in each generator's hourly shape; what differs is the cap window. Make this explicit:
- On the Allocation tab, add a short "How allocation works" note under the method options: "In all four methods a generator's allocation follows its own hourly output shape — it is never moved into the hours that happen to need it. The methods differ only in the window within which allocation is capped at consumption: every hour, every month, the whole year, or not at all."
- In each option's description, state the cap window in one phrase (e.g. "capped at each month's consumption; shape preserved within the month").
- In the Results header (and later in reports), show one line that names the method and the shape rule, e.g. "Monthly matching target · allocation capped at monthly consumption · generator shape preserved". For "Hourly matching only" say "capped at hourly consumption · no over-allocation possible". For "As produced (no cap)" say "no cap · generator shape preserved".
- Add a tooltip on the term "shape preserved" explaining it in two sentences.

## Out of scope
A mode without shape preservation (none is defined; the platform's half-hourly-preservation-with-monthly-window behaviour fills the month in date order and is not a scenario the tool should offer).
