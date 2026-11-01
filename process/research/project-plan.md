# Scenario Analysis Tool v3 — Project Plan

*Draft for review, 1 Nov 2026. Public version first; white-label client version is a follow-on project.*

## 1. What we're building

A free, public, browser-only tool that lets anyone build a **portfolio** of consumers and generators (from a built-in library or their own CSVs), allocate generation to consumers, and see their **hourly matching score** computed the way the Granular platform computes it (as-consumed allocation with shape preservation), then **save scenarios and compare them side by side**.

It replaces both existing tools (v1 "builder + compare", v2 "portfolio + allocation matrix") and will take over `scenarios.granular-energy.com`.

## 2. Decisions taken (from our Q&A)

| Area | Decision |
|---|---|
| Audience | Public lead-gen first. White-label, logged-in client version later; keep engine and data model reusable for it. |
| Old sites | Retire v1/v2; point `scenarios.granular-energy.com` at v3 when ready. |
| Code | Start from scratch in a new repo. Old repo used only as reference for profile shapes and PDF export approach. GitHub/Vercel access to be sorted before deploy. |
| Matching granularity | Hourly, monthly, annual (user-selectable). |
| Shape preservation | Half-hourly/hourly only (platform default). No "raw potential" mode. |
| Strategy | As-consumed only. |
| Allocation | Generator → consumer percentage matrix (each generator's output split across consumers; column total ≤ 100%). |
| Metrics | Hourly score, annual score (laid out clearly as context), excess MWh, unmatched MWh. |
| Sample data | Generic "typical year": 8,760 hourly slots, 1 Jan 00:00 – 31 Dec 23:00, local clock time, no DST, no real year. Works in any country. |
| Uploads | Two-column CSV (timestamp, value), hourly or half-hourly, timezone-aware parsing, must cover 12 contiguous months. |
| Library | v1's 16 profiles: 9 consumption (data centre, office ×2, factory, residential ×2, retail, hospital, EV fleet) and 7 generation (onshore wind ×2, offshore wind, solar ×2, hydro, nuclear). |
| Sizing | Consumers: annual MWh. Generators: installed MW with a per-technology capacity factor. |
| Limits | Up to 5 consumers and 5 generators. |
| Saving | Browser localStorage, plus a downloadable PDF report (results + all inputs) and a scenario `.json` file that re-imports in one click. |
| Compare | Up to 4 scenarios: score tiles, overlaid monthly chart, assumptions diff table, per-consumer breakdown. Comparison PDF export. |
| CTA | Soft banner linking to granular-energy.com; **HubSpot form required before downloading any PDF**. |
| Style | Granular design system (Inter / Space Grotesk, teal `#00988B`, off-white page, white cards, platform technology colours) on a tabbed layout. |
| Process | Three-agent harness, updated to current best practice (section 7). |
| Timing | ~2 weeks. |

## 3. Scope

**In:** everything in section 2.
**Out (for now):** accounts/backend, as-produced strategy, monthly/annual shape preservation, priority-based allocation, carbon metrics, hourly CSV export, Excel upload, multi-column CSV, partial-year uploads, white-labelling.

## 4. Architecture

**Stack:** Vite + React 18 + TypeScript (strict), Highcharts via `highcharts-react-official` (commercial licence held), PapaParse, html2canvas + jsPDF, Vitest, Playwright (for the evaluator), Vercel. No backend.

```
src/
├── engine/            # Pure TS, zero React: the matching engine (reusable in white-label version)
│   ├── typicalYear.ts   # 8,760-slot calendar, month boundaries
│   ├── allocate.ts      # As-consumed allocation with shape preservation
│   ├── score.ts         # Hourly/annual scores, excess, unmatched, per-generator contributions
│   └── __tests__/       # Unit tests + golden fixtures generated from revolt
├── data/
│   ├── profiles/        # 16 built-in profiles as JSON (normalised shapes) + registry with capacity factors
│   └── samples/         # Sample CSVs for download ("try an upload")
├── io/                # CSV parsing, tz handling, validation, scenario import/export
├── state/             # Portfolio + scenario reducer/context, localStorage persistence
├── components/
│   ├── layout/          # Header, tabs, CTA band, HubSpot gate modal
│   ├── portfolio/       # Profile library picker, upload, sizing inputs
│   ├── allocation/      # Matrix grid, matching settings
│   ├── results/         # Score tiles, heatmap, monthly, contributions, example day, Sankey
│   ├── compare/         # Scenario list, side-by-side view
│   └── report/          # PDF report + comparison PDF
├── styles/            # Design tokens from the granular-style guide
└── App.tsx
```

### 4.1 Data model

- `TypicalYear`: 8,760 hourly slots; helpers for month/day/hour lookup. Uploads are mapped onto these slots.
- `Profile { id, name, kind: 'consumption'|'generation', technology?, source: 'library'|'upload', shape: number[8760] }` — library shapes sum to 1.0; uploads are stored as actual MWh plus a derived shape.
- `PortfolioMember { profileId, label, sizing: { annualMWh } | { capacityMW } | 'asUploaded' }` → resolved to an hourly MWh series.
- `AllocationMatrix: Record<generatorId, Record<consumerId, pct>>`.
- `MatchingSettings { granularity: 'hourly'|'monthly'|'annual' }` (shape preservation and strategy fixed, but stored so the white-label version can vary them).
- `Scenario { id, name, createdAt, consumers, generators, matrix, settings, results }` — results cached so Compare is instant; uploaded profiles embedded so the `.json` is self-contained.

### 4.2 Engine (mirrors revolt `CoreAllocationEngine`, as-consumed, half-hourly preservation)

For each **matching window** (hour / month / whole year):
1. For each consumer *c*, remaining demand `D_c` = sum of consumption in the window.
2. For each generator *g* (processed in descending volume order, as revolt does), its supply available to *c* is `pct[g][c] × G_g(window)`.
3. Allocation quantity to *c* = `min(available, D_c remaining)`, distributed across the window's hours **in proportion to g's own hourly shape** (this is the shape preservation). Reduce `D_c` accordingly.
4. Per hour: `matched = min(allocated_c(h), demand_c(h))`, `excess = allocated − matched`, `unmatched = demand − matched`.

Scores: hourly = Σ matched / Σ demand; annual = Σ allocated / Σ demand. Hourly granularity reduces to per-hour `min()`; monthly/annual produce excess in some hours and shortfall in others, which is the point of showing them.

**Parity check:** a standalone script in revolt (`working_dir/scenario_tool/generate_golden_fixtures.py`) runs `CoreAllocationEngine` on the sample profiles for each granularity and writes JSON fixtures; the TS engine must reproduce them to within rounding. This answers Priya's "is it respecting shape preservation?" with a test, not an assertion.

### 4.3 Upload handling (answers Samuel's tz point)

- Parse timestamps (ISO with/without offset, common `dd/mm/yyyy hh:mm` forms). User picks the timezone the data is in (default UTC; auto-detected when offsets are present).
- Convert to local clock time in that zone, then map onto typical-year slots by (month, day, hour). Merge the duplicated DST hour, interpolate the missing one, drop 29 Feb with a notice.
- Half-hourly → summed to hourly. Units selectable (kWh / MWh / kW / MW average).
- Reject anything not covering 12 contiguous months, with a plain-English message.

## 5. UI

Tabs: **Portfolio → Allocation → Results → Compare**, with a persistent score strip once results exist.

- **Portfolio:** two panels (consumers, generators). "Add from library" with a sizing field (annual MWh / MW), or "Upload CSV" with tz/unit pickers and a preview chart. Max 5 each. Sample CSVs downloadable.
- **Allocation:** matrix grid (generators as rows, consumers as columns, % cells with column totals and warnings), matching-granularity selector with a one-line explanation of each option.
- **Results:** per-consumer selector plus "whole portfolio"; tiles (hourly score, annual score, excess MWh, unmatched MWh); hourly heatmap; monthly score + generator contribution; average day and example day; Sankey of generator → consumer → matched/excess/unmatched. "Save scenario" and "Download report" (HubSpot-gated).
- **Compare:** pick up to 4 saved scenarios; tiles row, overlaid monthly chart, assumptions table with differences highlighted, per-consumer table; "Download comparison PDF" (gated). Import scenario `.json`.
- **CTA band** on every tab; Granular logo top-left; responsive down to phone width.

## 6. Reports and lead capture

- **Scenario report PDF:** cover with scores, inputs section (every profile, sizing, matrix, granularity, tz/unit of uploads), charts, footer "Generated by Granular Energy Scenario Analysis Tool".
- **Scenario file (.json):** complete and re-importable; recommended in the PDF's footer as the way to reproduce it.
- **HubSpot gate:** embed the same HubSpot form used on the marketing site in a modal; on submit, unlock downloads for the session (remembered in localStorage so returning users aren't re-asked). Needs the form/portal IDs from marketing.

## 7. Build process: harness v2

What changed since April (from Anthropic's harness post and current Claude Code docs):

| April 2026 harness | Now |
|---|---|
| Many small sprints, evaluator after each | Fewer, larger **milestones**; evaluator pass per milestone; generator self-checks within a milestone (Anthropic dropped the sprint construct once models stopped needing it). |
| Evaluator reads code and runs tests | Evaluator also **drives the running app with Playwright** and grades against hard per-criterion thresholds; calibrated with example verdicts to stop it rubber-stamping. |
| Free-text APPROVED/NEEDS REVISION parsed from output | **Structured JSON verdict** via `--json-schema`; harness branches on `pass` and feeds `issues` back. |
| One generic `claude -p` call per role | Roles defined as **subagents** in `.claude/agents/` with model, effort, tool allow/deny lists and turn caps. Evaluator always a fresh session that hasn't seen the generator's reasoning. |
| No budget/turn limits, `--allowedTools` only | `--permission-mode dontAsk` + explicit allowlists, `--max-turns`, `--max-budget-usd`, Stop hook that runs `tsc`/`vitest`/`eslint` and blocks completion on failure. |
| Planner wrote detailed sprint contracts | Planner stays **high-level** (scope + acceptance criteria); technical detail left to the generator, per Anthropic's finding that planner-level technical errors cascade. |
| Human review at the end | **Human gate between milestones** (you test the preview, file FEEDBACK.md entries). |

Mechanics: shell loop of `claude -p` calls (works unattended, per-role isolation and budgets). The Workflow tool is a reasonable alternative but adds a plan/permission dependency; we can switch later. The golden fixtures from revolt act as the engine's hard oracle, so the evaluator's judgement only matters for UI and data handling.

## 8. Milestones (target 14 days)

| # | Days | Milestone | Done when |
|---|---|---|---|
| M0 | 1–2 | Spec, repo, harness, fixtures | New repo with CLAUDE.md, research docs, agents, hooks, harness script; golden fixtures generated from revolt; sample profiles converted to typical-year JSON with capacity factors. |
| M1 | 2–4 | Engine | `src/engine` passes unit tests and golden fixtures for all three granularities; runs < 50 ms for 5×5 portfolio. |
| M2 | 4–7 | Portfolio + Allocation | Library pick, sizing, CSV upload with tz/unit/validation, matrix grid, settings; state persisted. |
| M3 | 7–9 | Results | All charts and tiles, per-consumer and portfolio views, Sankey; mobile layout. |
| M4 | 9–12 | Scenarios, Compare, Reports | Save/load/import/export, Compare view, both PDFs, HubSpot gate. |
| M5 | 12–14 | Polish, QA, launch | Design-system pass, accessibility basics, Priya/Samuel/Charles review of engine parity and tz handling, Vercel deploy, domain switched. |

## 9. Risks and open items

- **GitHub / Vercel access:** confirm you (or Ben) can create the repo under `granular-energy` and link Vercel; otherwise build locally and hand over at M5.
- **HubSpot form IDs** from marketing, and whether the form should post a "scenario tool" lead source.
- **Highcharts licence key** for the production build.
- **Engine parity sign-off:** who confirms "this is how the platform does it"? Suggest Charles, using the golden fixtures.
- **Leap-year uploads and odd DST zones:** handled by dropping 29 Feb and merging/filling DST hours; document it in the upload help text.
- **Bundle size:** 16 profiles × 8,760 values ≈ 1.5 MB as JSON; ship as compact arrays and lazy-load.

## 10. Still to decide

1. Repo name (`scenario-analysis-tool-v3`? `matching-scenarios`?).
2. Default values for library sizing (e.g. data centre 50,000 MWh, solar 20 MW) and capacity factors per technology (I'll propose UK-typical figures for review).
3. Which HubSpot form, and whether the gate applies to the scenario `.json` download too (I'd say no: gate PDFs only).
4. Whether to seed the app with a demo scenario so first-time visitors see results immediately (I'd say yes).
