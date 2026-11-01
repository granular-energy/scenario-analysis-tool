# Milestone M2 brief: Portfolio and Allocation tabs

Build the first two tabs of the app so a user can assemble a portfolio and define allocations, with results computed live by the engine (results are displayed in detail in M3; for M2 a persistent score strip showing hourly and annual score for the whole portfolio is enough).

In scope:
- App shell: Granular header (wave logo, title "Scenario Analysis Tool"), tabs Portfolio / Allocation / Results / Compare (Results and Compare may be placeholders), soft CTA band at the bottom linking to https://granular-energy.com. Off-white page, white cards, teal accent, Inter/Space Grotesk, responsive to 375px.
- Portfolio tab: two panels, Consumers and Generators, max 5 each. "Add from library" picks a profile from `src/data/profiles/registry.json` with a label and a sizing field (consumers: annual MWh; generators: capacity MW, showing the capacity factor and resulting annual MWh). "Upload CSV" accepts a two-column CSV (timestamp, value) at hourly or half-hourly resolution, with timezone and unit pickers, validates 12 contiguous months, and shows a preview chart and a clear error message when rejected. Each member shows a small shape preview and can be removed or re-sized.
- Allocation tab: matrix grid with generators as rows and consumers as columns, percentage cells (0–100), per-generator row total with a warning when over 100, and a matching-granularity selector (hourly / monthly / annual) with a one-line explanation of each. "Allocate evenly" helper fills each row equally.
- State in a reducer/context, persisted to localStorage so a reload restores the portfolio and matrix.
- A demo portfolio loads on first visit (data centre 50,000 MWh; solar PV temperate 25 MW; onshore wind temperate 10 MW; 100% allocations; hourly) so the score strip shows numbers immediately: hourly 67.33%, annual 67.33% (from the golden fixtures, scenario `single-consumer-solar-wind`).
- `src/io`: CSV parsing, timezone normalisation and typical-year mapping as specified in `process/research/engine-spec.md` section 4, fully unit tested with fixtures covering ISO timestamps with and without offsets, `dd/mm/yyyy hh:mm`, half-hourly data, a DST spring-forward and fall-back day, a leap year, and a 3-month file that must be rejected.
- Sample CSVs in `public/samples/` (one consumption, one generation, 12 months, hourly, UTC) that round-trip through the uploader.

Out of scope: results charts (M3), saving/compare/PDF/HubSpot (M4), styling polish beyond the tokens (M5).
