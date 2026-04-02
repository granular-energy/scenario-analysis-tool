# Phase 1 Plan — Scenario Analysis Tool V1

## Overview

Build a complete, deployable hourly CFE matching estimator as a Vite + React + TypeScript single-page app with Highcharts visualisations. The tool ships with 6 pre-built UK profiles (3 consumption, 3 generation), real-time calculation, and Granular Energy branding.

## Sprint 1: Project Scaffolding, Types & Profile Data

Set up the Vite project, TypeScript configuration, profile data structures, and all 6 bundled profiles with realistic UK 8760 data.

| # | Criterion | How to verify |
|---|-----------|---------------|
| 1.1 | Vite + React + TypeScript project initialised with strict mode enabled in `tsconfig.json` | Run `npm install && npm run build` — completes without errors. Check `tsconfig.json` has `"strict": true` |
| 1.2 | Highcharts and `highcharts-react-official` installed as dependencies | Run `npm ls highcharts highcharts-react-official` — both listed |
| 1.3 | Vitest configured and a placeholder test passes | Run `npm test` — at least one test passes |
| 1.4 | TypeScript types defined in `src/types/` for `Profile` (id, name, category, region, technology, description, data: number[]), `GenerationMix` (technology → percentage mapping), and `MatchingResult` (cfeScore, hourlyMatched array, monthlyScores) | Read `src/types/` — all three types exist with correct fields. Run `npm run typecheck` — no errors |
| 1.5 | Three consumption profile JSON files exist in `src/data/profiles/consumption/` (uk-data-centre, uk-office, uk-factory), each with exactly 8,760 numeric values that sum to approximately 1.0 | Read each file, verify `data.length === 8760` and `Math.abs(sum - 1.0) < 0.001`. Profiles should show realistic patterns: data centre near-flat, office with weekday peaks, factory with shift patterns |
| 1.6 | Three generation profile JSON files exist in `src/data/profiles/generation/` (uk-wind-onshore, uk-solar-pv, uk-hydro), each with exactly 8,760 numeric values that sum to approximately 1.0 | Read each file, verify `data.length === 8760` and `Math.abs(sum - 1.0) < 0.001`. Wind should be winter-heavy, solar daytime-only with summer peaks, hydro seasonally varying |
| 1.7 | Profile registry files (`index.ts`) in both consumption/ and generation/ directories export arrays of all available profiles | Read both index files — they import and re-export all profile JSONs. Import works in a test file without errors |

## Sprint 2: Core Calculation Engine

Implement the hourly matching calculation as pure, tested utility functions.

| # | Criterion | How to verify |
|---|-----------|---------------|
| 2.1 | `scaleProfile(profile, percentage, totalAnnualConsumption)` function in `src/utils/matching.ts` correctly scales a normalised profile | Unit test: given a profile summing to 1.0, percentage=50, totalConsumption=1000 → scaled profile sums to 500 |
| 2.2 | `calculateHourlyMatching(consumptionProfile, generationMix, generationProfiles)` returns a `MatchingResult` with correct `cfeScore` | Unit test: 100% of a single technology with a profile identical to the consumption profile → cfeScore = 100%. A flat generation profile against a peaky consumption profile → cfeScore < 100% |
| 2.3 | Surplus generation in any hour is capped (not banked) | Unit test: generation = [2,0] consumption = [1,1] → matched = [1,0], cfeScore = 50%, not 100% |
| 2.4 | `monthlyScores` array has 12 values, each representing the CFE score for that month | Unit test: verify array length is 12 and scores are between 0-100 |
| 2.5 | All calculation functions are pure (no side effects, no imports from React) | Read `src/utils/matching.ts` — no React imports, no DOM access, no mutation of inputs |
| 2.6 | All tests pass | Run `npm test` — all pass. Run `npm run typecheck` — no errors |

## Sprint 3: UI Components — Profile Selector & Mix Sliders

Build the interactive controls: consumption profile dropdown and generation technology percentage sliders.

| # | Criterion | How to verify |
|---|-----------|---------------|
| 3.1 | `ProfileSelector` component renders a dropdown listing all 3 consumption profiles by name | Run `npm run dev`, open in browser — dropdown shows "UK Data Centre", "UK Office Building", "UK Factory" |
| 3.2 | Selecting a consumption profile updates the app state (selected profile changes) | Select different profiles — verify via React DevTools or by observing downstream calculation changes |
| 3.3 | `MixSliders` component renders one slider per generation technology (Wind, Solar, Hydro) | Visual inspection — three labelled sliders visible on page |
| 3.4 | Each slider ranges from 0% to 200% with current value displayed | Drag sliders to extremes — labels update, 0% and 200% reachable |
| 3.5 | Slider changes trigger recalculation and the headline CFE score updates in real-time | Move a slider — CFE score number visibly changes without page reload or perceptible delay |
| 3.6 | Default state: Data Centre profile selected, all sliders at 0% | Refresh page — data centre selected, all sliders at 0%, score shows 0% |
| 3.7 | `npm run build` completes without errors | Run `npm run build` — success |

## Sprint 4: Visualisations — Headline Score & Monthly Breakdown

Implement the CFE score headline display and monthly bar chart using Highcharts.

| # | Criterion | How to verify |
|---|-----------|---------------|
| 4.1 | Headline CFE score displays as a large, prominent percentage (e.g., "72%") that updates reactively | Set sliders to non-zero values — large score number visible and updates as sliders move |
| 4.2 | Monthly breakdown bar chart renders 12 bars (Jan–Dec) showing per-month CFE scores | Visual inspection — 12 labelled bars visible. Winter months should score higher with wind-heavy mix, summer months higher with solar-heavy mix |
| 4.3 | Bar chart updates reactively when sliders or profile selection changes | Change a slider — bars visibly update |
| 4.4 | Highcharts tooltips show month name and exact score on hover | Hover over a bar — tooltip displays e.g., "January: 85.3%" |
| 4.5 | Chart is responsive — renders correctly at both desktop (1200px+) and tablet (768px) widths | Resize browser window — chart reflows without overflow or clipping |
| 4.6 | `npm run build` completes without errors | Run `npm run build` — success |

## Sprint 5: Visualisations — Hourly Heatmap & Technology Contribution

Implement the hourly matching heatmap and technology contribution breakdown chart.

| # | Criterion | How to verify |
|---|-----------|---------------|
| 5.1 | Hourly heatmap renders a 365×24 grid (days on x-axis, hours on y-axis) coloured by matching percentage per hour | Visual inspection — heatmap visible with colour gradient. Clear day/night patterns visible with solar mix |
| 5.2 | Heatmap colour scale ranges from 0% (unmatched) to 100% (fully matched) with a visible legend | Legend visible showing colour gradient with 0% and 100% labels |
| 5.3 | Heatmap tooltip shows date, hour, and matching percentage on hover | Hover over a cell — tooltip displays e.g., "15 March, 14:00 — 92%" |
| 5.4 | Technology contribution chart shows a stacked area or stacked bar breakdown of how each technology contributes to matched energy | Visual inspection — chart shows coloured segments for Wind, Solar, Hydro with a legend |
| 5.5 | Both charts update reactively when sliders or profile selection changes | Change inputs — both charts visibly update |
| 5.6 | All charts render without console errors | Open browser DevTools console — no Highcharts errors or React warnings |
| 5.7 | `npm run build` completes without errors | Run `npm run build` — success |

## Sprint 6: Layout, Branding & Polish

Apply Granular Energy branding, responsive layout, CTA, and final polish for deployment readiness.

| # | Criterion | How to verify |
|---|-----------|---------------|
| 6.1 | Page has a header with Granular Energy logo (or placeholder) and tool title "Scenario Analysis Tool" | Visual inspection — header with logo and title visible |
| 6.2 | Layout arranges controls (profile selector + sliders) and visualisations in a logical, scannable hierarchy | Visual inspection — controls at top or left, results below or right. Not jumbled |
| 6.3 | Soft CTA visible: "Want a detailed analysis?" with link to granular-energy.com | Visual inspection — CTA text and link present, link opens correct URL |
| 6.4 | Page is responsive: usable on mobile (375px), tablet (768px), and desktop (1200px+) | Test at each breakpoint — no horizontal scroll, controls and charts readable |
| 6.5 | `npm run build` produces a working production build that can be previewed | Run `npm run build && npm run preview` — app loads and functions correctly at the preview URL |
| 6.6 | `npm run lint` and `npm run typecheck` pass with no errors | Run both commands — zero errors |
| 6.7 | All tests pass | Run `npm test` — all pass |
