# Handover, 2 Nov 2026 (overnight session)

## Done (M0 complete, M1 engine complete, part of M2)

- New project at `~/Documents/GitHub/scenario-analysis-tool-v3`, local git, 3 commits. Not on GitHub or Vercel.
- `src/engine`: pure TS as-consumed engine with shape preservation; 20 unit tests; parity with the platform engine proven against `src/engine/fixtures/revolt-golden.json` (12 cases, hour-by-hour on the first scenario).
- `src/io`: CSV upload parser (ISO/slashed timestamps, offsets → chosen IANA zone, half-hourly summing, kWh/MWh/kW/MW units, 29 Feb dropped, DST duplicate summed, DST gap filled, 12-contiguous-month validation with gap messages); 14 tests.
- 16 built-in profiles + `registry.json` with capacity factors and default sizes (my proposals, please review).
- Granular design tokens, fonts, logo assets; `CLAUDE.md`; research docs; milestone briefs M2–M5; harness (`process/scripts/harness.sh`), subagents, hooks.
- revolt side: `working_dir/scenario_tool/generate_golden_fixtures.py` (standalone, untracked in revolt).

## Two things I decided that you should know about

1. **Shape preservation pairing.** The platform pairs each matching granularity with the shape-preservation resolution of the same length (hourly↔half-hourly, monthly↔monthly, annual↔annual). Using half-hourly preservation with monthly matching fills the month chronologically rather than by generator shape, which is not what the tool should show. So the fixtures (and engine) use the matched pairing. The user-facing choice is still just "hourly / monthly / annual".
2. **Hourly matching interleaves generators in two half-hour passes** because the platform's data is half-hourly. Totals are identical to a single pass; per-generator splits differ, and the engine reproduces the platform's split. Details in `process/research/engine-spec.md`.

## Not done / your call

- The harness has not been run. First run: `cd ~/Documents/GitHub/scenario-analysis-tool-v3 && ./process/scripts/harness.sh M2` (expect ~1–3 h, budget cap $30 per role call; adjust with `--budget`). Watch the first round.
- Open decisions from the plan: repo name, HubSpot form IDs, Highcharts licence key, GitHub/Vercel access, who signs off engine parity.
- Default sizes and capacity factors in `src/data/profiles/registry.json` are UK-typical guesses.

## Launch state (2026-11-25)

- Milestones M2–M6 complete. M6 added the HubSpot sign-up gate (full-app gate on first visit).
- **Hosting**: Vercel project `scenario-analysis-tool` under Toby's personal Vercel account (toblerone74), production URL https://scenario-analysis-tool.vercel.app. Deployed with `vercel --prod` from the working tree; the project is not yet linked to GitHub, so redeploys are manual until it is. Transfer to a Granular Vercel team and add the `scenarios.granular-energy.com` CNAME when marketing/IT are ready.
- **GitHub**: `granular-energy/scenario-analysis-tool` holds the old v1/v2 tool on `main`/`v2`. v3 is pushed to branch `v3`; switching `main` to v3 is a deliberate step for Toby.
- **HubSpot**: EU portal 25772642, form "Scenario Analysis Tool sign-up" (`8aa9943b-d138-4200-bc7e-d61b3465a59b`). Forms from the current HubSpot editor only render through the per-portal embed script (`forms/embed/<portal>.js` + `.hs-form-frame`), not `v2.js`; submission arrives as a `hsFormCallback` postMessage. Open items from HubSpot's review: no reCAPTCHA, no GDPR consent field.
- Playwright builds with `VITE_HUBSPOT_FORM_ID=REPLACE_WITH_FORM_ID` so the dev-mode gate tests still run; production uses the real ID by default.

### Update 2026-11-25

- M7 ("Set % of consumption" allocation mode) shipped: toggle on the Allocation tab, consumption matrix persisted and saved in scenario files, per-consumer total % allocated, mode shown in Results, Compare and PDFs. In this mode the engine treats the assigned volume (pct × consumer demand) as the generator's generation; surplus only arises when hourly matching clips the shape.
- The M7 harness generator finished but its process hung (API idle timeout); the milestone was verified manually: typecheck, lint, 156 unit tests, 112 Playwright tests.
- Custom domain: https://scenarios.granular-energy.com now points at the `scenario-analysis-tool` project (detached from the old `claude-harness` project via the project-domains API). DNS was already on Vercel, so no record changes were made.
