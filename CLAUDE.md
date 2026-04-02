# Scenario Analysis Tool

A free, public-facing hourly energy matching estimator built by Granular Energy. Users select a consumption profile and generation technology mix, and the tool calculates and visualises their hourly CFE (Carbon-Free Energy) matching score.

## Tech Stack

- **React 18** with TypeScript, scaffolded with **Vite**
- **Highcharts** (with `highcharts-react-official` wrapper) for all visualisations
- **CSS Modules** or **Tailwind CSS** for styling
- No backend — entirely client-side, deployed to **Vercel**
- Profile data bundled as JSON imports (no API calls)

## Project Structure

```
src/
├── components/          # React components
│   ├── Layout/          # Page layout, header, footer, CTA
│   ├── ProfileSelector/ # Consumption profile dropdown
│   ├── MixSliders/      # Generation technology percentage sliders
│   └── Charts/          # Highcharts visualisation components
├── data/
│   └── profiles/        # JSON profile data + registry
│       ├── consumption/ # Load profiles (8760 hourly values)
│       └── generation/  # Generation profiles (8760 hourly values)
├── hooks/               # Custom React hooks (useMatchingCalculation etc.)
├── utils/               # Pure calculation functions
│   └── matching.ts      # CFE score calculation logic
├── types/               # TypeScript type definitions
├── App.tsx
└── main.tsx
```

## Coding Standards

- TypeScript strict mode, no `any` types
- Functional components with hooks only (no class components)
- Pure functions for all calculations (no side effects in utils/)
- Descriptive variable names; energy domain terms preferred (e.g., `loadProfile`, `generationMix`, `cfeScore`)
- Components should be small and focused — one responsibility per component
- All calculation logic must be unit tested
- Use `useMemo` for expensive computations that depend on profile/slider state

## Build & Test

```bash
npm install
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm test             # Run tests (Vitest)
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
```

## Key Calculation

```
CFE% = SUM(min(generation_h, consumption_h)) / SUM(consumption_h) × 100
```

- Each technology's profile is normalised (sums to 1.0)
- Scaled by: `percentage × totalAnnualConsumption / 1.0`
- Generation profiles are summed per hour, then `min(totalGen_h, load_h)` applied
- Result is volume-weighted average across 8,760 hours

## Branding

- Granular Energy logo and brand colours
- Soft CTA linking to granular-energy.com (no email capture)
- Professional, clean design appropriate for energy sector audience

## Important Notes

- Profile data must have exactly 8,760 values (non-leap year)
- All profiles are normalised to sum to 1.0 for consistent scaling
- Sliders allow 0-200% per technology (over-procurement is valid)
- The tool must feel instant — calculations are O(8760), no loading states needed
- Highcharts is commercially licensed — use the npm package directly
