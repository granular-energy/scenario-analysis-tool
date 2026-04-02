# Scenario Analysis Tool — Product Specification

## Purpose

A free, public-facing web tool that lets electricity sector professionals estimate their **hourly CFE (Carbon-Free Energy) matching score** based on different generation technology mixes. Built by Granular Energy as a lead-generation tool that demonstrates the value of hourly vs annual matching.

## Target Users

- Energy procurement managers
- Sustainability/ESG teams at corporates
- Energy suppliers evaluating portfolio composition
- Anyone exploring 24/7 CFE strategies

## Core Concept

Users select a **consumption profile** (what they use) and a **generation mix** (what they procure), and the tool calculates how well generation matches consumption on an hour-by-hour basis across a full year (8,760 hours).

The key insight the tool reveals: annual matching (buying enough certificates to cover total annual consumption) gives a very different picture than hourly matching (checking coverage hour by hour). A portfolio that appears "100% renewable" annually may only achieve 60-80% hourly matching.

## Calculation

### Hourly CFE Score Formula

```
CFE% = SUM(min(generation_h, consumption_h)) / SUM(consumption_h) × 100
```

Where:
- `generation_h` = total generation from all technologies in hour h
- `consumption_h` = load in hour h
- The `min()` function caps each hour — surplus generation cannot be banked to cover deficit hours
- The sum runs over all 8,760 hours

### Technology Mix Logic

- Users specify a percentage per technology (e.g., 60% wind, 40% solar)
- Percentage = share of **annual consumption** that technology's annual generation covers
- The percentages can sum to more or less than 100% (over/under-procurement)
- For each technology: `scaled_profile_h = base_profile_h × (percentage × total_annual_consumption / total_annual_generation_of_profile)`

## V1 Features

### Consumption Profiles (Pre-built, UK-based)

1. **Data Centre** — Near-flat 24/7 load with slight cooling peaks in summer afternoons
2. **Office Building** — Weekday 08:00-18:00 peaks, minimal weekend/night load, seasonal HVAC variation
3. **Factory** — Shift-based pattern (e.g., two shifts weekdays), reduced weekends

### Generation Profiles (Pre-built, UK-based)

1. **Wind (onshore)** — Higher in winter, lower in summer. No strong diurnal pattern. UK capacity factor ~25-30%
2. **Solar PV** — Daytime only, summer peaks, zero at night. UK capacity factor ~10-12%
3. **Hydro (run-of-river)** — Seasonal pattern following rainfall. Relatively steady within day. UK capacity factor ~35-40%

### User Interaction Flow

1. Select a consumption profile from dropdown
2. Adjust generation technology mix using sliders (0-100% per technology)
3. Tool instantly recalculates and displays results
4. Results update in real-time as sliders move

### Visualisations

1. **Headline CFE Score** — Large percentage number, prominently displayed
2. **Hourly Heatmap / Time Series** — Shows matched vs unmatched hours across the year. X-axis = days/months, Y-axis = hours of day, colour = matching percentage
3. **Monthly Breakdown** — Bar chart showing CFE score per month, highlighting seasonal variation
4. **Technology Contribution** — Stacked area chart or breakdown showing how each technology contributes to the overall score

### Branding & CTA

- Granular Energy branding (logo, brand colours)
- Soft CTA: "Want a detailed analysis? Learn more about Granular Energy" (link to main site)
- No email gate or mandatory lead capture

## V1 Non-Features (Deferred)

- Custom CSV upload for consumption/generation profiles
- Region/country selection beyond UK
- Battery storage modelling
- Grid carbon intensity / emissions calculations
- Location-based matching (grid region constraints)
- Export / PDF report generation
- User accounts or saved scenarios

## Profile Data Architecture

Profiles should be structured for easy extensibility:

```
src/data/profiles/
├── consumption/
│   ├── index.ts          # Registry of all consumption profiles
│   ├── uk-data-centre.json
│   ├── uk-office.json
│   └── uk-factory.json
└── generation/
    ├── index.ts          # Registry of all generation profiles
    ├── uk-wind-onshore.json
    ├── uk-solar-pv.json
    └── uk-hydro.json
```

Each profile JSON:
```json
{
  "id": "uk-wind-onshore",
  "name": "UK Onshore Wind",
  "category": "generation",
  "region": "UK",
  "technology": "wind",
  "unit": "kWh",
  "description": "Typical UK onshore wind farm output profile",
  "data": [0.42, 0.38, ...] // 8760 hourly values, normalised to sum to 1.0
}
```

Normalising profiles to sum to 1.0 allows easy scaling by the percentage × annual consumption calculation.

## Performance Considerations

- 8,760 values per profile × 3-6 profiles in memory = ~200KB total. Trivial for browser.
- Calculation is O(8760) per update — sub-millisecond, no debouncing needed.
- Profiles bundled as JSON at build time (imported directly, no fetch).
- Highcharts can handle 8,760 data points per series efficiently.
- Heatmap (365 × 24 = 8,760 cells) is within Highcharts comfort zone.

## Domain Glossary

- **CFE** — Carbon-Free Energy
- **8760** — The number of hours in a standard year; shorthand for an annual hourly time series
- **Hourly matching** — Comparing generation and consumption hour by hour
- **Annual matching** — Comparing total annual generation vs total annual consumption
- **EAC** — Energy Attribute Certificate (GO, REGO, REC, I-REC etc.)
- **PPA** — Power Purchase Agreement
- **Capacity factor** — Actual output / theoretical maximum output, expressed as %
- **Load profile** — Time series of electricity consumption
- **Generation profile** — Time series of electricity production
