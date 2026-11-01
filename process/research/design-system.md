# Granular design system (extract for this project)

Source: Granular Energy brand style guide. Tokens below are implemented in `src/styles/tokens.css`. Logo files are in `public/brand/`.

## Quick Reference — Colors

### Primary Palette

| Role | Token | Hex | Usage |
|------|-------|-----|-------|
| **Teal (primary)** | teal-700 | `#00988B` | CTAs, highlights, key data, accent text, icons |
| **Teal dark** | teal-800 | `#03857A` | Hover/active states |
| **Teal darker** | teal-900 | `#06756C` | Pressed states |
| **Teal mid** | teal-500 | `#94D1CC` | Secondary accents, light interactive |
| **Teal bg light** | teal-300 | `#E6F5F3` | Section backgrounds, callout fills |
| **Teal bg lighter** | teal-200 | `#E8F4F3` | Subtle highlight panels |
| **Teal bg subtle** | teal-100 | `#F2FAF9` | Very light tint backgrounds |
| **Black** | neutral-1000 | `#2A2929` | Headings, primary text |
| **Dark grey** | neutral-800 | `#56514E` | Body text |
| **Medium grey** | neutral-600 | `#897F78` | Captions, labels, secondary text |
| **Light grey** | neutral-300 | `#E3E0DD` | Borders, dividers, table lines |
| **Off-white bg** | neutral-100 | `#FBFAF9` | Page/slide backgrounds |
| **Alt bg** | neutral-200 | `#F2EFED` | Alternating row fills |
| **White** | — | `#FFFFFF` | Cards, content panels |

### Chart / Data Visualization Colors

These colors map to specific energy technology types and must be used consistently across all charts and graphs:

Every technology has two colours — **allocated** (saturated) for matching and **excess** (lighter pastel) for excess. Key examples:

| Technology | Allocated | Excess | Notes |
|-----------|-----------|--------|-------|
| **Demand** (spline) | `#0F4974` | — | Smooth spline (Catmull-Rom), 2px, no markers, zIndex 10. Never a fill. |
| **Battery** | `#CBC0E9` | `#DDD6F1` | |
| **Solar** | `#FDCF77` | `#FEE0A7` | |
| **Onshore Wind** | `#58CAA1` | `#92DDC2` | |
| **Offshore Wind** | `#A6E5CF` | `#C5EEE0` | |
| **Wind** | `#81D8B9` | `#ADE6D1` | Generic wind |
| **Biomass** | `#57B06B` | `#92CC9F` | |
| **Hydro** | `#6EA1DD` | `#A1C2E9` | |
| **Nuclear** | `#AB80CC` | `#C8ACDE` | |
| **Geothermal** | `#F3A45B` | `#F7C494` | |
| **Biogas** | `#F6AFAF` | `#F9CBCB` | |
| **Gas** | `#E86571` | `#F09BA3` | |
| **Coal** | `#A4776C` | `#C4A79F` | |
| **Unknown** | `#B3BFC9` | `#CED5DC` | Fallback for unrecognised tech |
| **Unallocated** | Stripe `#CEE7DF` on `#FAFAFA` | — | 45° hatched pattern (demand not covered) |

See `references/charts.md` for the full 20-technology table, stacking order, bar spacing, excess colour logic, calculation rules, and per-library implementation references (matplotlib, Chart.js, Plotly, SVG).

### Domain-Specific Colors (from `app/static/colors.ts`)

These are used for energy flow concepts (not technology types):

| Concept | Hex | Usage |
|---------|-----|-------|
| **Demand** | `#0F4974` | Demand-side data, demand line in charts |
| **Supply** | `#1FB084` | Supply-side data |
| **Matched** | `#007F8A` | Matched energy (temporal matching) |
| **Short** | `#006582` | Shortfall / under-allocated |
| **Long / Surplus** | `#1FB084` | Surplus energy |
| **Production** | `#92CF64` | Production data |
| **Excesses (allocated)** | `#1FB084` (solid) | Allocated excess — solid fill, same as supply green |
| **Excesses (unallocated)** | Stripe `#1FB084` on bg `#B9DFDC` | Unallocated excess — 45° hatched pattern |
| **Others in excess** | `#8DBFA8` | Overflow "Others" bucket for excess |
| **Unallocated** | Stripe `#CEE7DF` on bg `#FAFAFA` | Unallocated demand — 45° hatched pattern, NOT solid fill |

### Status / Semantic Colors

| Status | Color | Hex |
|--------|-------|-----|
| Success / matching | green-700 | `#08875D` |
| Success bg | green-100 | `#F1F9F6` |
| Warning / not allocated | yellow-700 | `#B25E09` |
| Warning bg | yellow-100 | `#FFF8EB` |
| Error / not delivered | red-700 | `#E02D3C` |
| Error bg | red-100 | `#FFF6F7` |
| Neutral / info | teal-700 | `#00988B` |

## Quick Reference — Typography

### Font Families

**IMPORTANT: Inter is the primary workhorse font.** Space Grotesk is used **sparingly** — only for main page/slide titles (H1 level). Everything else uses Inter.

| Role | Font | Weight | Notes |
|------|------|--------|-------|
| **Titles (title-100, title-200)** | Space Grotesk | Bold (700) | Black `#2A2929`. Use sparingly — only for the main title on a slide, page, or document cover. |
| **Headings (heading-100, heading-200)** | Inter | Normal (400) or SemiBold (600) | Black `#2A2929`. NOT Space Grotesk. |
| **Body text** | Inter | Normal (400), Medium (500), SemiBold (600) | Dark grey `#56514E` (neutral-800). |
| **Labels** | Inter | Medium (500) | Various sizes. |
| **Buttons** | Inter | SemiBold (600) | 14px or 13px. |
| **Data/numbers** | Inter | Medium (500) | numbers-100 class = 32px. |
| **Chart titles** | Inter | SemiBold (600) | NOT Space Grotesk. Charts use Inter throughout. |
| **Chart axis labels** | Inter | Normal (400) | Grey `#897F78` (neutral-600). |
| **Links** | Inter | Normal (400) | Underline on hover. |

**Global:** `font-feature-settings: "tnum"; font-variant-numeric: tabular-nums` — all numbers use monospaced/tabular width.

**Fallbacks:** Arial, sans-serif. For Japanese locale, use Noto Sans JP (400, 500, 600).

### Typography Scale (from `app/styles.css`)

**Titles (Space Grotesk Medium):**

| Class | Size | Line-height |
|-------|------|-------------|
| title-100 | 32px | 1.75rem (28px) |
| title-200 | 17px | 1.5rem (24px) |

**Headings (Inter):**

| Class | Size | Weight |
|-------|------|--------|
| heading-100-light | 44px | Normal (400) |
| heading-100-heavy | 44px | SemiBold (600) |
| heading-200-light | 20px | Normal (400) |
| heading-200-heavy | 20px | SemiBold (600) |

**Body (Inter):**

| Class | Size | Weight |
|-------|------|--------|
| body-100-light / body-100-heavy | 16px | Normal / SemiBold |
| body-200 / body-200-light / body-200-heavy | 14px | Medium / Normal / SemiBold |
| body-250-light / body-250-heavy | 13px | Normal / SemiBold |
| body-300-light / body-300-heavy | 12px | Normal / SemiBold |
| body-400-light / body-400-heavy | 12px (tighter line-height) | Normal / SemiBold |

**Buttons:** button-100 (SemiBold 14px), button-200 (SemiBold 13px)
**Labels:** label-100 (14px), label-200 (13px), label-300 (12px), label-400 (10px) — all Medium weight
**Numbers:** numbers-100 (Medium, 32px)
**Links:** link-100 (16px), link-200 (14px) — Normal weight, underline on hover

### Presentation / Document Size Mapping

| Element | Presentations | Documents |
|---------|--------------|-----------|
| Title (Space Grotesk) | 36-44pt | 24-28pt |
| Section heading (Inter) | 28-32pt | 18-20pt |
| Card title (Inter) | 20-24pt | 14-16pt |
| Body (Inter) | 16-18pt | 11-12pt |
| Caption (Inter) | 12-14pt | 9-10pt |

## Quick Reference — Layout Principles

1. **Generous whitespace.** Granular's brand feels spacious and uncluttered. Use wide margins and padding. When in doubt, add more space.

2. **Off-white backgrounds** (`#FBFAF9` neutral-100) for main page/slide backgrounds, not pure white. Content cards and panels use `#FFFFFF` with subtle borders (`#E3E0DD` neutral-300).

3. **Teal accent panels** — section dividers or key statements use the light teal background (`#E6F5F3` teal-300 or `#E8F4F3` teal-200) as a full-width band.

4. **Logo placement** — the Granular Energy wave mark (icon) goes in the **top-right corner** of slides and documents. The full wordmark ("granular energy" + wave) is used on title slides and cover pages only.

5. **Grid-based layouts** — content aligns to clean grids. Two- and three-column layouts are common. Cards use consistent spacing and subtle rounded corners (4-8px).

6. **Icons** — use simple, line-weight teal icons (`#00988b`). The brand uses a consistent icon style: outlined, single-color, geometric. Avoid filled/solid icons.

7. **Photography** — when used, features renewable energy infrastructure (wind turbines, solar panels) and team photos. Images are placed in clean rectangular frames with no borders.

8. **Diagrams and flow charts** — use rounded rectangles with light fills (`#eef7f6` for teal, `#f9f6f4` for neutral). Arrows are teal (`#00988b`), thin, with small arrowheads. Labels in Inter.

## Tone of Voice

## Web implementation reference

# HTML & React — Granular Energy Style

## CSS Variables / Design Tokens

```css
:root {
  /* Teal (primary) — from tailwind-preset.js */
  --ge-teal-100: #F2FAF9;
  --ge-teal-200: #E8F4F3;
  --ge-teal-300: #E6F5F3;
  --ge-teal-500: #94D1CC;
  --ge-teal-700: #00988B;  /* Primary accent */
  --ge-teal-800: #03857A;  /* Hover */
  --ge-teal-900: #06756C;  /* Pressed */
  --ge-teal: var(--ge-teal-700);
  --ge-teal-hover: var(--ge-teal-800);
  --ge-teal-bg: var(--ge-teal-300);

  /* Neutrals */
  --ge-neutral-100: #FBFAF9;  /* Off-white bg */
  --ge-neutral-200: #F2EFED;  /* Alt bg */
  --ge-neutral-300: #E3E0DD;  /* Borders, dividers */
  --ge-neutral-400: #D2CECB;
  --ge-neutral-500: #B8B2AD;
  --ge-neutral-600: #897F78;  /* Caption text */
  --ge-neutral-700: #6C6560;
  --ge-neutral-800: #56514E;  /* Body text */
  --ge-neutral-900: #3D3A38;
  --ge-neutral-1000: #2A2929; /* Headings */
  --ge-black: var(--ge-neutral-1000);
  --ge-dark-grey: var(--ge-neutral-800);
  --ge-medium-grey: var(--ge-neutral-600);
  --ge-light-grey: var(--ge-neutral-300);
  --ge-off-white: var(--ge-neutral-100);
  --ge-white: #FFFFFF;

  /* Semantic */
  --ge-success: #08875D;     /* green-700 */
  --ge-success-bg: #F1F9F6;  /* green-100 */
  --ge-warning: #B25E09;     /* yellow-700 */
  --ge-warning-bg: #FFF8EB;  /* yellow-100 */
  --ge-error: #E02D3C;       /* red-700 */
  --ge-error-bg: #FFF6F7;    /* red-100 */

  /* Technology colors */
  --ge-tech-hydro: #6EA1DD;
  --ge-tech-biomass: #57B06B;
  --ge-tech-wind: #81D8B9;
  --ge-tech-solar: #FDCF77;
  --ge-tech-others: #B3BFC9;

  /* Gradient ramp */
  --ge-gradient-100: #0F4974;
  --ge-gradient-400: #00988B;
  --ge-gradient-900: #FFDB4C;

  /* Typography */
  --ge-font-heading: 'Space Grotesk', sans-serif;
  --ge-font-body: 'Inter', sans-serif;

  /* Spacing scale */
  --ge-space-xs: 8px;
  --ge-space-sm: 16px;
  --ge-space-md: 24px;
  --ge-space-lg: 40px;
  --ge-space-xl: 64px;
  --ge-space-xxl: 96px;

  /* Border radius */
  --ge-radius-sm: 4px;
  --ge-radius-md: 8px;
  --ge-radius-lg: 12px;

  /* Domain colors (app/static/colors.ts) */
  --ge-domain-demand: #0F4974;
  --ge-domain-supply: #1FB084;
  --ge-domain-matched: #007F8A;
  --ge-domain-short: #006582;
  --ge-domain-production: #92CF64;
  --ge-domain-unallocated: #CEE7DF;
  --ge-domain-unmatched: #CFDBE3;

  /* Shadows (from Tailwind preset) */
  --ge-shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --ge-shadow-sm: 0 2px 4px 0 rgba(0, 0, 0, 0.10), 0 0 3px 0 rgba(0, 0, 0, 0.15);
  --ge-shadow-md: 0 4px 12px 0 rgba(42, 41, 41, 0.16);
  --ge-shadow-lg: 0 8px 16px 0 rgba(0, 0, 0, 0.10), 0 1px 3px 0 rgba(0, 0, 0, 0.10);
  --ge-shadow-xl: 0 16px 32px 0 rgba(0, 0, 0, 0.12), 0 1px 3px 0 rgba(0, 0, 0, 0.12);
}
```

## Typography CSS

```css
/* Import fonts — use ONE of the following approaches: */

/* Option A: Google Fonts CDN (works when page has internet access) */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500&family=Inter:wght@400;500;600&display=swap');

/* Option B: Self-hosted / embedded (REQUIRED for standalone HTML files, local file:// access, or offline use).
   Download the .ttf/.woff2 files from Google Fonts and embed as @font-face with base64 data URIs:
   @font-face { font-family: 'Inter'; font-weight: 400; src: url(data:font/ttf;base64,...) format('truetype'); }
   @font-face { font-family: 'Inter'; font-weight: 500; src: url(data:font/ttf;base64,...) format('truetype'); }
   @font-face { font-family: 'Inter'; font-weight: 600; src: url(data:font/ttf;base64,...) format('truetype'); }
   @font-face { font-family: 'Space Grotesk'; font-weight: 500; src: url(data:font/ttf;base64,...) format('truetype'); }
   IMPORTANT: If the HTML contains inline <svg> elements, you MUST also add a <style> block with the same
   @font-face declarations INSIDE the <svg> element — SVG text elements do not reliably inherit fonts from the HTML CSS.
*/

/* Global: tabular numbers everywhere */
* {
  font-feature-settings: "tnum";
  font-variant-numeric: tabular-nums;
}

/* Titles — Space Grotesk Medium (500), used sparingly */
.title-100 {
  font-family: var(--ge-font-heading);
  font-weight: 500;
  font-size: 32px;
  line-height: 1.75rem;
  color: var(--ge-black);
}
.title-200 {
  font-family: var(--ge-font-heading);
  font-weight: 500;
  font-size: 17px;
  line-height: 1.5rem;
  color: var(--ge-black);
}

/* Headings — Inter, NOT Space Grotesk */
.heading-100-light { font-family: var(--ge-font-body); font-weight: 400; font-size: 44px; color: var(--ge-black); }
.heading-100-heavy { font-family: var(--ge-font-body); font-weight: 600; font-size: 44px; color: var(--ge-black); }
.heading-200-light { font-family: var(--ge-font-body); font-weight: 400; font-size: 20px; color: var(--ge-black); }
.heading-200-heavy { font-family: var(--ge-font-body); font-weight: 600; font-size: 20px; color: var(--ge-black); }

/* Body — Inter */
.body-100-light { font-size: 16px; font-weight: 400; }
.body-100-heavy { font-size: 16px; font-weight: 600; }
.body-200       { font-size: 14px; font-weight: 500; }
.body-200-light { font-size: 14px; font-weight: 400; }
.body-200-heavy { font-size: 14px; font-weight: 600; }
.body-250-light { font-size: 13px; font-weight: 400; }
.body-250-heavy { font-size: 13px; font-weight: 600; }
.body-300-light { font-size: 12px; font-weight: 400; }
.body-300-heavy { font-size: 12px; font-weight: 600; }

/* Buttons */
.button-100 { font-weight: 600; font-size: 14px; }
.button-200 { font-weight: 600; font-size: 13px; }

/* Labels */
.label-100 { font-weight: 500; font-size: 14px; }
.label-200 { font-weight: 500; font-size: 13px; }
.label-300 { font-weight: 500; font-size: 12px; }
.label-400 { font-weight: 500; font-size: 10px; }

/* Numbers */
.numbers-100 { font-weight: 500; font-size: 32px; }

/* Links */
.link-100 { font-size: 16px; font-weight: 400; text-decoration: none; }
.link-200 { font-size: 14px; font-weight: 400; text-decoration: none; }
.link-100:hover, .link-200:hover { text-decoration: underline; }

body, p, li, td {
  font-family: var(--ge-font-body);
  font-weight: 400;
  color: var(--ge-dark-grey);
  font-size: 14px;
  line-height: 1.5;
}

/* Accent text */
.text-teal { color: var(--ge-teal); }
```

## React Component Patterns

### Tailwind Classes (when available)

Since Granular's palette doesn't map directly to default Tailwind, use inline styles or extend the config. With base Tailwind, approximate with:

- Background: `bg-stone-50` (close to off-white)
- Cards: `bg-white rounded-lg shadow-sm border border-stone-200`
- Teal accents: use inline `style={{ color: '#00988b' }}`

### KPI Card Component

```jsx
const KPICard = ({ label, value, unit, highlight }) => (
  <div style={{
    backgroundColor: '#ffffff',
    border: '1px solid #e5e0db',
    borderRadius: '8px',
    padding: '20px 24px',
    minWidth: '180px',
  }}>
    <div style={{
      fontFamily: 'Inter',
      fontSize: '14px',
      color: '#897f78',
      marginBottom: '8px',
    }}>
      {label}
    </div>
    <div style={{
      fontFamily: 'Space Grotesk',
      fontSize: '28px',
      fontWeight: 500,
      color: '#2a2929',
      letterSpacing: '-0.03em',
    }}>
      {value}
      <span style={{ fontSize: '16px', color: '#897f78', marginLeft: '4px' }}>
        {unit}
      </span>
    </div>
    {highlight && (
      <div style={{
        display: 'inline-block',
        backgroundColor: '#e8f5f3',
        color: '#00988b',
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: 500,
        marginTop: '8px',
      }}>
        {highlight}
      </div>
    )}
  </div>
);
```

### Badge / Pill Component

```jsx
const Badge = ({ children, variant = 'teal' }) => {
  const styles = {
    teal: { bg: '#e8f5f3', color: '#00988b' },
    success: { bg: '#e8f5e9', color: '#4caf50' },
    warning: { bg: '#fff8e1', color: '#f5a623' },
    error: { bg: '#ffebee', color: '#e53935' },
  };
  const s = styles[variant];
  return (
    <span style={{
      backgroundColor: s.bg,
      color: s.color,
      padding: '2px 12px',
      borderRadius: '12px',
      fontSize: '13px',
      fontWeight: 500,
      fontFamily: 'Inter',
    }}>
      {children}
    </span>
  );
};
```

### Data Table Component

```jsx
const DataTable = ({ headers, rows }) => (
  <table style={{
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: 'Inter',
    fontSize: '14px',
  }}>
    <thead>
      <tr style={{ backgroundColor: '#eef7f6' }}>
        {headers.map((h, i) => (
          <th key={i} style={{
            padding: '12px 16px',
            textAlign: 'left',
            fontWeight: 600,
            color: '#2a2929',
            borderBottom: '2px solid #e5e0db',
          }}>
            {h}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, i) => (
        <tr key={i} style={{
          backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9f6f4',
        }}>
          {row.map((cell, j) => (
            <td key={j} style={{
              padding: '10px 16px',
              color: '#4a4a4a',
              borderBottom: '1px solid #e5e0db',
            }}>
              {cell}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);
```

## Page Layout

```css
.page-container {
  background-color: var(--ge-off-white);
  min-height: 100vh;
}

.content-card {
  background: var(--ge-white);
  border: 1px solid var(--ge-light-grey);
  border-radius: var(--ge-radius-md);
  padding: var(--ge-space-lg);
  box-shadow: var(--ge-shadow-card);
}

.section-highlight {
  background: var(--ge-mint-bg);
  padding: var(--ge-space-xl) var(--ge-space-lg);
}

/* Navigation / sidebar — matches platform */
.sidebar {
  background: var(--ge-white);
  border-right: 1px solid var(--ge-light-grey);
  width: 220px;
}

.sidebar-item {
  padding: 8px 16px;
  font-size: 14px;
  color: var(--ge-dark-grey);
  border-radius: var(--ge-radius-sm);
}

.sidebar-item.active {
  color: var(--ge-teal);
  font-weight: 500;
}
```

## Buttons

```css
/* Primary button */
.btn-primary {
  background-color: var(--ge-teal);
  color: white;
  border: none;
  border-radius: var(--ge-radius-sm);
  padding: 10px 20px;
  font-family: var(--ge-font-body);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s;
}
.btn-primary:hover { background-color: var(--ge-teal-hover); }

/* Secondary button */
.btn-secondary {
  background-color: var(--ge-white);
  color: var(--ge-dark-grey);
  border: 1px solid var(--ge-light-grey);
  border-radius: var(--ge-radius-sm);
  padding: 10px 20px;
  font-family: var(--ge-font-body);
  font-size: 14px;
}
```

## Key Principles

1. **Off-white page backgrounds** — never pure white for the full page
2. **White content cards** on top of the off-white background
3. **Teal is the only accent** — no additional colors for interactive elements
4. **Generous spacing** — the brand feels spacious and considered
5. **Clean data tables** — matching the platform's table style with subtle alternating rows
6. **Filter pills** — teal background `#E6F5F3` with teal text, rounded, used for active filters (matching the platform UI)
7. **Tabular numbers** — all numbers use `font-feature-settings: "tnum"; font-variant-numeric: tabular-nums`

## Breakpoints

| Token | Width |
|-------|-------|
| sm | 640px |
| md | 768px |
| lg | 1024px |
| xl | 1280px |
| 2xl | 1536px |

## Animations

Standard easing: `cubic-bezier(0.16, 1, 0.3, 1)`

```css
/* Content show (modals, popovers) */
@keyframes contentShow { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
.content-show { animation: contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1); }

/* Overlay */
@keyframes overlayShow { from { opacity: 0; } to { opacity: 1; } }
.overlay-show { animation: overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1); }

/* Slide in (panels, drawers) */
@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
.slide-in { animation: slideIn 150ms cubic-bezier(0.16, 1, 0.3, 1); }

/* Directional fades (tooltips, dropdowns) — 400ms */
@keyframes slideDownAndFade { from { opacity: 0; transform: translateY(-2px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideUpAndFade { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }

/* Hide / dismiss */
@keyframes hide { from { opacity: 1; } to { opacity: 0; } }
.hide { animation: hide 100ms ease-in; }
```

## AG Grid Theme Overrides

When using AG Grid, apply these overrides to match the Granular platform:

```css
.ag-theme-granular {
  --ag-header-background-color: #FBFAF9;  /* neutral-100 */
  --ag-row-hover-color: #F2FAF9;          /* teal-100 */
  --ag-selected-row-background-color: #E6F5F3; /* teal-300 */
  --ag-range-selection-border-color: #00988B;   /* teal-700 */
  --ag-font-family: 'Inter', Arial, sans-serif;
  --ag-font-size: 14px;
  --ag-header-font-size: 13px;
  --ag-header-font-weight: 600;
  --ag-borders: none;
  --ag-border-radius: 0;
  --ag-row-border-color: #E3E0DD;         /* neutral-300 */
}

## Charts

# Charts & Data Visualization — Granular Energy Style

This reference covers matplotlib, plotly, Chart.js, and general charting guidance to match the Granular Energy platform's visual style.

## Chart Creation Workflow

When generating chart data and rendering a Granular-style chart, follow this order:

1. **Generate data** — build the per-bar dataset (matching, excess, unallocated per tech)
2. **Validate** — run `scripts/validate_chart_data.py` (see § Data Validation below). Fix any invariant violations before proceeding
3. **Translate spacing params** — map the Highcharts spacing spec to your target renderer (see § Chart Spacing, Layout & Interactions)
4. **Render** — build the chart following the stacking order table (see § Series Stacking & Legend Order)
5. **Visual check** — confirm demand line sits at matching + unallocated boundary, excess extends above it, bars have correct spacing

## Data Validation (mandatory)

**Always run `validate_chart_data.py` before rendering** to catch invariant violations in generated sample data. The script is in `scripts/validate_chart_data.py`.

```python
from validate_chart_data import validate_chart_data

bars = [
    {
        'label': '12:00',
        'demand': 100,
        'unallocated': 0,
        'techs': {
            'solar': {'matching': 60, 'excess': 25},
            'wind':  {'matching': 40, 'excess': 15},
        },
    },
    # ... one dict per bar/time-bin
]

errors = validate_chart_data(bars, same_resolution=True)
if errors:
    raise ValueError("Chart data invalid:\n" + "\n".join(errors))
```

The four rules it checks:
1. **Demand invariant** — `demand == sum(tech_matching) + unallocated`
2. **Resolution rule** — if `same_resolution=True`, each bar has either `unallocated > 0` or `sum(excess) > 0`, never both
3. **Allocation balance** — `tech_matching + tech_excess == tech_allocated` (when `allocated` is provided)
4. **Non-negativity** — no negative values

For the full invariant explanations, see § How Matching & Excess Are Calculated.

---

# Part 1: Visual Specification

Everything in this section is library-agnostic — it describes WHAT the chart should look like, not HOW to build it in any specific library.

## Colour Reference

This is the canonical color mapping used throughout the Granular Energy platform. These colors are non-negotiable when plotting energy data by technology type.

```python
# Canonical Granular Energy color palette for energy technologies
# Source: config/styles/tailwind-preset.js — technology color tokens
#
# Every technology has TWO colors: "allocated" (saturated) for the matching
# portion and "excess" (lighter/pastel) for the excess portion.
# The index controls default rendering order when no data-driven order exists.

TECH_COLORS = {
    #                        Allocated   Excess     Index
    'battery':              ('#CBC0E9', '#DDD6F1'),  # 0
    'solar':                ('#FDCF77', '#FEE0A7'),  # 1
    'onshore_wind':         ('#58CAA1', '#92DDC2'),  # 2
    'offshore_wind':        ('#A6E5CF', '#C5EEE0'),  # 3
    'wind':                 ('#81D8B9', '#ADE6D1'),  # 4
    'any_renewable':        ('#8195A9', '#ADBAC7'),  # 5
    'biodegradable':        ('#B9E198', '#D1ECBC'),  # 6
    'biomass':              ('#57B06B', '#92CC9F'),  # 7
    'geothermal':           ('#F3A45B', '#F7C494'),  # 8
    'landfill_gas':         ('#F398CD', '#F7BCDF'),  # 9
    'sewage_gas':           ('#FBCEE6', '#FCDFEF'),  # 10
    'biogas':               ('#F6AFAF', '#F9CBCB'),  # 11
    'gas':                  ('#E86571', '#F09BA3'),  # 12
    'marine':               ('#BAD9F6', '#D2E6F9'),  # 13
    'hydro':                ('#6EA1DD', '#A1C2E9'),  # 14
    'unknown':              ('#B3BFC9', '#CED5DC'),  # 15
    'coal':                 ('#A4776C', '#C4A79F'),  # 16
    'nuclear':              ('#AB80CC', '#C8ACDE'),  # 17
    'other':                ('#E3E0DD', '#F2EFED'),  # 18
    'hydrogen_engine':      ('#355A8C', '#7C94B4'),  # 19
    'any_fossil':           ('#A9B6C2', '#A9B6C2'),  # 20  (same for both)
}

# Technology GROUP colors (for multi-tech supply preferences)
TECH_GROUP_COLORS = {
    #                                    Allocated   Excess     Index
    'wind_solar':                       ('#A5B89F', '#C4D1C0'),  # 20
    'wind_solar_hydro':                 ('#D2B48C', '#E1CEB4'),  # 21  (note: source has '#D2B48' — assumed '#D2B48C')
    'wind_solar_hydro_nuclear':         ('#FFCBA4', '#F8D6C3'),  # 22
}

# Convenience accessors
def get_tech_allocated(tech): return TECH_COLORS.get(tech.lower(), ('#00988B', '#00988B'))[0]
def get_tech_excess(tech):    return TECH_COLORS.get(tech.lower(), ('#00988B', '#00988B'))[1]

# Excess color fallback for non-technology breakdowns (country, device, etc.):
# Lighten the allocated color by 25%:  Color(color).lighten(0.25).hex()
```

## Brand Gradient Ramp

Used for heatmaps, scales, decorative elements:

```python
GRADIENT = [
    '#0F4974',  # gradient-100 (deep navy)
    '#006582',  # gradient-200
    '#007F8A',  # gradient-300
    '#00988B',  # gradient-400 (= teal-700)
    '#1FB084',  # gradient-500
    '#5AC276',  # gradient-600
    '#92CF64',  # gradient-700
    '#C9D753',  # gradient-800
    '#FFDB4C',  # gradient-900 (warm yellow)
]
```

## Domain-Specific Colors

Use these for energy flow concepts (not technology types):

```python
DOMAIN_COLORS = {
    'demand': '#0F4974',       # Demand-side data / demand line
    'supply': '#1FB084',       # Supply-side data / supply line
    'matched': '#007F8A',      # Matched energy (temporal matching)
    'short': '#006582',        # Shortfall / under-allocated
    'long': '#1FB084',         # Surplus
    'production': '#92CF64',   # Production
    'excesses': '#1FB084',           # Allocated excess — solid fill (= supply green)
    'excesses_bg': '#B9DFDC',        # Background for unallocated excess hatching
    'other_excess': '#8DBFA8',       # Overflow "Others" bucket (allocated + excess)
    'striped_bg': '#CAE8DF',         # Alternative striped background token
    'unallocated': '#CEE7DF',        # Stripe color — hatched on #FAFAFA bg
    'unallocated_bg': '#FAFAFA',     # Background for unallocated hatching
    'unmatched': '#CFDBE3',          # Unmatched demand (shortfall) stripe color
    'unmatched_bg': '#FAFAFA',       # Background for unmatched hatching
}
```

## The Signature Chart

### Default chart type

The **signature Granular chart** is a **hybrid chart**: **stacked bars** for allocations with a **demand line** overlaid on top. This is the default for any demand/allocation/supply time series chart. Do NOT use stacked area charts — always use stacked bars.

### Stacking order

The bar fills with what was matched first, then shows what's missing (unallocated), then shows what's left over (excess). The demand line floats above everything.

**Implementation stacking order — datasets bottom to top:**

```
Layer 1 (bottom):  Matched tech A          — TECH_COLORS['a'][0] (saturated)
Layer 1 continued: Matched tech B          — TECH_COLORS['b'][0] (saturated)
Layer 1 continued: ...more matched techs   — (up to 10, then "Others" #8DBFA8)
Layer 2:           Unallocated (hatched)    — #CEE7DF stripes on #FAFAFA
─────────────────  ← DEMAND LINE HERE ──── — y = sum(matching) + unallocated
Layer 3:           Excess tech A            — TECH_COLORS['a'][1] (pastel)
Layer 3 continued: Excess tech B            — TECH_COLORS['b'][1] (pastel)
Layer 3 continued: ...more excess techs     — (overflow → "Other excess" #8DBFA8)
                   ← DEMAND SPLINE ON TOP — — #0F4974, 2px, zIndex 10, no markers
```

At same resolution (the default), each bar has **either** unallocated **or** excess, never both. The stack simplifies to: `[matched] + [unallocated OR zero] + [excess OR zero]`, with the demand line at the matched + unallocated boundary. See § Matching Resolution vs Plotting Resolution for when both can co-exist.

**Demand line** — the spline always renders on top of all bars.

**Y-axis headroom** — set the y-axis maximum to accommodate excess above the demand line: `suggestedMax = max(demand + total_excess) × 1.1`. Do not clip excess bars.

**Legend order:** Total/Demand → Individual technologies → Others → Unallocated → Individual excess items → Others in excess.

For bar spacing and padding values, see § Chart Spacing, Layout & Interactions.

### Demand line

The demand line is the most important single element in Granular charts. It is always a **smooth spline curve** (not straight line segments), rendered on top of everything else.

| Property | Value |
|----------|-------|
| **Color** | `#0F4974` (deep navy) |
| **Line type** | Smooth spline (Catmull-Rom interpolation — curves pass exactly through each data point) |
| **Line width** | 2px |
| **Dash style** | Solid (no dashes) |
| **Line cap** | Round |
| **Markers** | None (no dots at data points) |
| **z-index** | 10 (renders on top of all stacked bars) |
| **Legend position** | First item in legend |
| **Connect nulls** | No (gaps where data is null) |
| **Hover state** | Disabled (no highlight on hover) |

**See § Part 2 for per-library implementation details.**

### Bar spacing

The main dashboard charts have two separate spacing concerns:

- **Vertical (segment-to-segment within a bar):** Within each bar, stacked segments sit flush against each other — no borders, gaps, or rounded corners between them (`borderWidth: 0`, `borderRadius: 0`).
- **Horizontal (bar-to-bar along the x-axis):** A small gap separates each time period. This is controlled by `pointPadding: 0.1` in Highcharts, or `barPercentage: 0.8` in Chart.js.

In short: **tight vertically, slightly spaced horizontally.**

**Stacked bar (StackedBar) column options:**

| Property | Value |
|----------|-------|
| borderRadius | 0 (sharp corners) |
| borderWidth | 0 (no border between stacked segments) |
| groupPadding | 0 (bars fill the full category width) |
| pointPadding | 0.1 (small horizontal padding between adjacent bars) |
| maxPointWidth | 300px |
| stacking | normal |
| minPointLength | not set (tiny values may be invisible) |

**Simple column chart (ColumnChart) options:**

| Property | Value |
|----------|-------|
| borderRadius | 0 |
| borderWidth | 0 |
| groupPadding | 0.3 (wider gaps between groups) |
| pointPadding | 0 |
| maxPointWidth | 150px |
| minPointLength | 3px (ensures tiny values are still visible) |
| height | 280px (fixed) |

**Chart.js equivalent spacing translation:**

The Highcharts spacing translates to Chart.js as follows. Formula: `barPercentage = 1 - 2 × pointPadding`, `categoryPercentage = 1 - 2 × groupPadding`.

**StackedBar (tight vertically, slightly spaced horizontally):**

| Highcharts property | Value | Chart.js equivalent | Value |
|---|---|---|---|
| `groupPadding` | 0 | `categoryPercentage` | 1.0 |
| `pointPadding` | 0.1 | `barPercentage` | 0.8 |
| `borderWidth` | 0 | `borderWidth` | 0 |
| `borderRadius` | 0 | `borderRadius` | 0 |

**SimpleColumn (spaced bars):**

| Highcharts property | Value | Chart.js equivalent | Value |
|---|---|---|---|
| `groupPadding` | 0.3 | `categoryPercentage` | 0.4 |
| `pointPadding` | 0 | `barPercentage` | 1.0 |

### Grid lines

| Property | Value |
|----------|-------|
| gridLineColor | `rgba(0, 0, 0, 0.2)` |
| gridLineDashStyle | Dot |
| gridLineWidth | 1px |
| minorGridLineColor | `rgba(0, 0, 0, 0.02)` |
| Minor ticks | enabled |

### Axis styling

| Property | Value |
|----------|-------|
| Axis line colour | `#CED6E9` |
| Tick colour | `#CED6E9` |
| Tick length | 0 (hidden) |
| Label colour | `#666666` |
| Label font size | 11px |
| Label distance | 8px from axis |
| Y-axis title font size | 9px |
| Y-axis title alignment | high (sits at top of axis) |
| Y-axis title rotation | 0 (horizontal, not rotated) |
| Y-axis title offset | 13px from axis, y: -10px |
| Y-axis minimum | 0 |

### Crosshair

| Property | Value |
|----------|-------|
| Colour | `#0F4974` (same as demand line) |
| Width | 1px |
| zIndex | 100 |

### Legend

The platform uses a **custom legend component** below the chart (Highcharts native legend is disabled).

| Property | Value |
|----------|-------|
| Position | Below chart, 16px top margin, wrapping row |
| Item font | `label-400` (Inter medium, 10px) |
| Item padding | 4px vertical, 12px left |
| Text wrapping | nowrap |
| Colour swatch (full) | min-width 44px, small border-radius |
| Colour swatch (compact) | 16×16px, align-middle |
| Swatch text colour | auto: black on light backgrounds, white on dark |
| Hatched series swatch | White background with 1px solid border in the pattern colour |
| Sort order | By legendIndex ascending |
| Hidden items | Series with all-null data are hidden |

### Hatched patterns

Categories representing gaps or incomplete assignment are rendered as **45-degree diagonal striped/hatched patterns**, NOT solid fills. Hatching always means "something still needs to happen." The visual distinction between categories is purely in the color pairing.

**Pattern specification (shared across all hatched categories):**

All hatched categories use the same geometric pattern: 8px × 8px tile, 3px stroke width, 45° diagonal, square linecap, opacity 1. Only the stripe and background colors differ.

| Category | Stripe color | Background | Meaning |
|----------|-------------|------------|---------|
| **Unallocated (demand)** | `#CEE7DF` (green-grey) | `#FAFAFA` (near-white) | Demand with no supply assigned yet |
| **Excess unallocated (supply)** | `#1FB084` (green) | `#B9DFDC` (light green-teal) | Excess supply not yet allocated to demand |

**Excesses — two visual treatments:**

1. **Excess (allocated)** — solid fill `#1FB084` (same as supply green). No pattern.
2. **Excess (unallocated)** — hatched: green stripes `#1FB084` on `#B9DFDC` background.
3. **"Others in excess"** — overflow bucket for grouped-by charts: solid `#8DBFA8`.

Additional color tokens:
- `chart.excesses`: `#1FB084` — primary excess color
- `chart.excessesBackground`: `#B9DFDC` — hatched background for unallocated excess
- `chart.stripedBackground`: `#CAE8DF` — alternative striped background token
- `chart.other`: `#8DBFA8` — overflow "Others" bucket including excess overflow

**See § Part 2 for per-library implementation code (matplotlib SVG, Plotly).**

### Excess colour logic

Every excess series must use a **per-technology pastel colour**, not the flat `#1FB084` supply green. The rule has three tiers:

#### 1. Known technologies → hardcoded excess colour

Each technology in `TECH_COLORS` has a dedicated excess color (the second value in the tuple). When rendering an excess series whose name matches a known technology, **always** use that colour:

```python
# Example: solar excess bar
color = TECH_COLORS['solar'][1]   # '#FEE0A7' (pastel yellow)
```

The full mapping is in the `TECH_COLORS` dict above. Key examples:

| Technology | Allocated (saturated) | Excess (pastel) |
|---|---|---|
| Solar | `#FDCF77` | `#FEE0A7` |
| Wind | `#81D8B9` | `#ADE6D1` |
| Onshore Wind | `#58CAA1` | `#92DDC2` |
| Hydro | `#6EA1DD` | `#A1C2E9` |
| Nuclear | `#AB80CC` | `#C8ACDE` |
| Biomass | `#57B06B` | `#92CC9F` |

#### 2. Unknown / non-technology breakdowns → lighten by 25%

When the series name doesn't match a known technology (e.g. a country, device, or custom group), compute the excess variant by lightening the allocated colour by 25%:

```python
# Python equivalent of Color(color).lighten(0.25).hex()
from colorsys import rgb_to_hls, hls_to_rgb

def lighten_hex(hex_color: str, amount: float = 0.25) -> str:
    """Lighten a hex colour by `amount` (0–1). Mirrors the `color` npm package."""
    r, g, b = int(hex_color[1:3], 16)/255, int(hex_color[3:5], 16)/255, int(hex_color[5:7], 16)/255
    h, l, s = rgb_to_hls(r, g, b)
    l = min(1.0, l + amount * (1.0 - l))
    r2, g2, b2 = hls_to_rgb(h, l, s)
    return f'#{int(r2*255):02x}{int(g2*255):02x}{int(b2*255):02x}'
```

#### 3. "Others in excess" overflow bucket → `#8DBFA8` (solid, no lightening)

When there are more than 10 excess groups, the overflow uses `#8DBFA8` (`colors.chart.other`) — the same solid colour as the regular "Others" allocated bucket.

### Portfolio chart (simplified 3-series)

The portfolio chart collapses the full stack into three series since there's no per-technology breakdown:

1. Supply matching (solid `#007F8A`) — base
2. Unallocated (hatched `#CEE7DF` on `#FAFAFA`)
3. ← Demand spline passes here (`#0F4974`, zIndex 10). `demand = matching + unallocated`.
4. Excess supply (solid `#1FB084`) — extends above the demand line

Legend order: Demand → Supply matching → Unallocated → Excess supply.

### Other chart types

**KPI cards description:**

When displaying summary statistics (like the platform's top-row KPI cards), use a clean layout with large bold values and descriptive labels. Place labels below values; use Inter font throughout.

**Percentage badges description:**

The platform shows matching percentages in colored badges (e.g., "89.4% of demand" in a green-teal pill). When creating similar visuals:
- Use `#00988b` background with white text for teal badges
- Use `#4caf50` for success/green badges
- Rounded corners, small padding
- Inter font, medium weight

### General Palette for Non-Energy Charts

When the chart isn't about energy technologies (e.g., revenue, customers, generic categories), use this ordered palette:

```python
GRANULAR_GENERAL_PALETTE = [
    '#00988B',  # teal-700 (primary)
    '#6EA1DD',  # Hydro blue
    '#57B06B',  # Biomass green
    '#81D8B9',  # Wind mint
    '#FDCF77',  # Solar yellow
    '#0F4974',  # gradient-100 (deep navy)
    '#897F78',  # neutral-600 (warm grey)
    '#AB80CC',  # Nuclear purple
]
```

### Y-axis headroom

Set the y-axis maximum to accommodate excess above the demand line:

```
suggestedMax = max(demand + total_excess) × 1.1
```

Do not clip excess bars.

### Matching score

The headline KPI shown on dashboards:

```
matching_score = sum(matched) / sum(demand)
```

Expressed as a percentage (e.g. "89.4% of demand matched"). This is computed over the full time range, not per-bar.

### Key Principles

1. **Demand is always a line**, never a filled area. It overlays the stacked bars.
2. **Allocations are always stacked BARS**, not stacked areas. This is the Granular house style. Even for time series, use bars (one per time period) with a demand line on top.
3. **Stacking order matters** — matched technologies at bottom, gap categories (hatched) in the middle, excess technologies (pastel) on top. See the stacking table above.
4. **No chartjunk** — remove top and right spines, use light gridlines, generous whitespace.
5. **Numbers use space as thousands separator** (European convention): `12 988.417` not `12,988.417`. Use `locale` or manual formatting.
6. **Legends go below the chart**, horizontal, wrapping row, 16px top margin — matching the platform style. Font: Inter medium 10px.
7. **Y-axis label** shows the unit (MWh, GWh, etc.) horizontally at the top of the axis, 9px font.
8. **Time series x-axis** — use clean date formatting. For hourly data show `"01 Jan, 00:00"` style. For daily, show `"01 Jul"`.
9. **Background** — chart background is transparent; the card container provides the white background.
10. **Grid lines are dotted** — `rgba(0,0,0,0.2)`, 1px, dot dash style. Not solid lines.
11. **Tight vertically, slightly spaced horizontally** — within each bar, stacked segments sit flush (borderWidth: 0, borderRadius: 0). Along the x-axis, bars have small horizontal gaps (Highcharts: pointPadding 0.1, groupPadding 0; Chart.js: barPercentage 0.8, categoryPercentage 1.0).
12. **Resolution determines co-occurrence** — if plotting resolution = matching resolution (the default assumption), a single bar shows either excess or shortfall, never both. Both can only appear in the same bar when the plotting resolution is coarser than the matching resolution (e.g., monthly bars from hourly data).

### Interactions

| Interaction | Behaviour |
|------------|-----------|
| Legend click | Disabled (series toggling prevented) |
| Legend hover | Dims all other series to 25% opacity |
| Column hover (StackedBar) | Updates legend values to show hovered bar's data |
| Column hover (ColumnChart) | Highcharts default hover state |
| Series inactive state | Disabled |
| Zoom | Enabled on x-axis; reset button aligned left |

### Typography in charts

**Inter throughout** — Font loading in HTML/React artifacts: Inter and Space Grotesk are not system fonts — you must load them explicitly. Add one of these to your `<head>`:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500&display=swap" rel="stylesheet">
```

Canvas-based renderers (Chart.js `<canvas>`) do **not** inherit CSS font-family — the font must be fully loaded before Chart.js renders. Use `document.fonts.ready.then(() => { /* init chart */ })` or place your `<script>` after the font `<link>`.

**IMPORTANT: Charts use Inter throughout — do NOT use Space Grotesk for chart titles or any chart text.** Space Grotesk is reserved for main page/slide titles only. Chart titles, axis labels, tick labels, legends, and all annotations within charts must use Inter. Never pass `fontfamily='Space Grotesk'` to any chart element. The global style configuration (see Part 2) sets Inter globally — do not override it.

### Chart container

| Property | Value |
|----------|-------|
| Spacing top | 20px |
| Spacing bottom | 10px |
| Spacing left / right | 0 |
| Background | transparent |
| Animation | disabled |
| Default chart type | column (stacked bar) |

---

# Part 2: Library Implementation Reference

Each subsection shows how to achieve Part 1's visual spec in a specific library.

## Matplotlib

### Configuration

```python
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm

def apply_granular_style():
    """Apply Granular Energy brand styling to matplotlib."""
    plt.rcParams.update({
        # Typography — Inter for EVERYTHING in charts (titles, labels, ticks, legend)
        'font.family': 'Inter',
        'font.size': 11,
        'axes.titlesize': 14,
        'axes.titleweight': 'bold',
        'axes.labelsize': 11,
        'figure.titlesize': 16,
        'figure.titleweight': 'bold',

        # Colors (from platform BaseChart config)
        'axes.facecolor': '#FFFFFF',
        'figure.facecolor': '#FBFAF9',       # neutral-100
        'axes.edgecolor': '#CED6E9',          # chart.axisLine
        'axes.labelcolor': '#666666',          # chart.axisLabel
        'xtick.color': '#666666',              # chart.axisLabel
        'ytick.color': '#666666',              # chart.axisLabel
        'text.color': '#2A2929',               # neutral-1000

        # Grid (dotted, semi-transparent — matches platform)
        'axes.grid': True,
        'grid.color': (0, 0, 0, 0.2),         # rgba(0,0,0,0.2)
        'grid.linewidth': 1,
        'grid.linestyle': ':',                 # dotted

        # Spines
        'axes.spines.top': False,
        'axes.spines.right': False,

        # Legend
        'legend.frameon': False,
        'legend.fontsize': 10,

        # Figure
        'figure.dpi': 150,
        'savefig.dpi': 200,
        'savefig.bbox': 'tight',
        'savefig.facecolor': '#FBFAF9',       # neutral-100
    })

# Call this at the top of any charting script
apply_granular_style()
```

Note: If the Inter font is not available in the environment, fall back to `'sans-serif'` — never use serif fonts.

### Hatched bar helper

```python
def add_hatched_bar(ax, x, heights, bottom, label, stripe_color, bg_color='#FAFAFA', bar_width=0.8):
    """Add a hatched bar segment for unallocated/excess-unallocated."""
    # Background fill
    ax.bar(x, heights, width=bar_width, bottom=bottom,
           color=bg_color, edgecolor='none')
    # Hatched overlay (45° stripes)
    ax.bar(x, heights, width=bar_width, bottom=bottom,
           color='none', edgecolor=stripe_color,
           hatch='///', linewidth=0, label=label)

# Usage:
# add_hatched_bar(ax, x, df['unallocated'], bottom, 'Unallocated', '#CEE7DF', '#FAFAFA')
# add_hatched_bar(ax, x, df['excess_unalloc'], bottom, 'Excess (unallocated)', '#1FB084', '#B9DFDC')
#
# For allocated excess (solid): use standard ax.bar(..., color='#1FB084')
# For "Others in excess" overflow: use ax.bar(..., color='#8DBFA8')
```

### Stacked bar + demand line

```python
import matplotlib.pyplot as plt
import numpy as np

def plot_demand_allocation(df, time_col, tech_columns, demand_col):
    """
    Plot the standard Granular demand/allocation hybrid chart:
    stacked bars for allocations + demand line overlay.

    df: DataFrame with time series data
    time_col: column name for x-axis (datetime)
    tech_columns: list of technology column names in stack order
    demand_col: column name for demand line
    """
    fig, ax = plt.subplots(figsize=(12, 5))

    x = np.arange(len(df))
    bar_width = 0.8

    # Stacked bars for technology allocations
    bottom = np.zeros(len(df))
    for tech in tech_columns:
        color = GRANULAR_COLORS.get(tech.lower(), '#00988b')
        ax.bar(x, df[tech], width=bar_width, bottom=bottom,
               label=tech.capitalize(), color=color, edgecolor='none')
        bottom += df[tech].values

    # Demand as smooth spline overlaid on top (Catmull-Rom interpolation)
    # Use scipy interpolation for smooth curve through data points
    from scipy.interpolate import make_interp_spline
    x_smooth = np.linspace(x.min(), x.max(), len(x) * 10)
    demand_vals = df[demand_col].values.astype(float)
    if len(x) >= 4:  # Need at least 4 points for cubic spline
        spl = make_interp_spline(x, demand_vals, k=3)
        y_smooth = spl(x_smooth)
        ax.plot(x_smooth, y_smooth, color='#0F4974',
                linewidth=2, label='Demand', zorder=10,
                solid_capstyle='round')
    else:
        ax.plot(x, demand_vals, color='#0F4974',
                linewidth=2, label='Demand', zorder=10,
                solid_capstyle='round')

    # X-axis labels
    ax.set_xticks(x)
    ax.set_xticklabels(df[time_col], fontsize=9, color='#897F78')

    # Styling
    ax.set_ylabel('MWh', color='#897F78', fontsize=10)
    ax.legend(loc='upper center', bbox_to_anchor=(0.5, -0.12),
              ncol=len(tech_columns) + 1, fontsize=9)

    return fig, ax
```

### Grouped-by chart with excess

```python
def plot_grouped_by_chart(df, time_col, tech_columns, demand_col,
                          unallocated_col=None):
    """
    Grouped-by chart with correct stacking order:
      Bottom: tech matching (saturated) → Others allocated
      Middle: unallocated (hatched)
      Top:    tech excess (pastel) → Other excess
      Float:  demand/total spline
    """
    fig, ax = plt.subplots(figsize=(12, 5))
    x = np.arange(len(df))
    bar_width = 0.8
    bottom = np.zeros(len(df))

    # --- Block 1: Matching technologies (saturated colours) ---
    for tech in tech_columns:
        matching_col = f'{tech}_matching'
        if matching_col in df.columns:
            color = get_tech_allocated(tech)
            ax.bar(x, df[matching_col], width=bar_width, bottom=bottom,
                   label=tech.capitalize(), color=color, edgecolor='none')
            bottom += df[matching_col].values

    # Others allocated overflow
    if 'others_matching' in df.columns:
        ax.bar(x, df['others_matching'], width=bar_width, bottom=bottom,
               label='Others', color='#8DBFA8', edgecolor='none')
        bottom += df['others_matching'].values

    # --- Block 2: Unallocated demand (hatched) ---
    if unallocated_col and unallocated_col in df.columns:
        bottom = add_hatched_bar(ax, x, df[unallocated_col], bottom,
                                 'Unallocated', '#CEE7DF', '#FAFAFA', bar_width)

    # --- Block 3: Excess technologies (pastel colours) ---
    for tech in tech_columns:
        excess_col = f'{tech}_excess'
        if excess_col in df.columns:
            color = get_tech_excess(tech)
            ax.bar(x, df[excess_col], width=bar_width, bottom=bottom,
                   label=f'{tech.capitalize()} excess', color=color, edgecolor='none')
            bottom += df[excess_col].values

    # Other excess overflow
    if 'others_excess' in df.columns:
        ax.bar(x, df['others_excess'], width=bar_width, bottom=bottom,
               label='Other excess', color='#8DBFA8', edgecolor='none')
        bottom += df['others_excess'].values

    # --- Floating: Demand spline ---
    from scipy.interpolate import make_interp_spline
    demand_vals = df[demand_col].values.astype(float)
    if len(x) >= 4:
        x_smooth = np.linspace(x.min(), x.max(), len(x) * 10)
        spl = make_interp_spline(x, demand_vals, k=3)
        ax.plot(x_smooth, spl(x_smooth), color='#0F4974',
                linewidth=2, label='Demand', zorder=10, solid_capstyle='round')
    else:
        ax.plot(x, demand_vals, color='#0F4974',
                linewidth=2, label='Demand', zorder=10, solid_capstyle='round')

    ax.set_xticks(x)
    ax.set_xticklabels(df[time_col], fontsize=9, color='#897F78')
    ax.set_ylabel('MWh', color='#897F78', fontsize=10)
    ax.legend(loc='upper center', bbox_to_anchor=(0.5, -0.15),
              ncol=4, fontsize=8)

    return fig, ax
```

### Simple bars, KPI cards

```python
# Vertical bars — use for allocation breakdowns, comparisons
ax.bar(categories, values, color='#00988b', edgecolor='none', width=0.6)

# Grouped bars — alternate teal shades
colors = ['#00988b', '#1a6b5a', '#a8d5a2']

# Horizontal bars — for rankings/lists
ax.barh(categories, values, color='#00988b', height=0.5)

# KPI / Summary Cards
def plot_kpi_cards(kpis: dict, fig_width=12):
    """
    kpis: dict of {'Label': ('value', 'unit')}
    e.g. {'Demand': ('2,466.186', 'MWh'), 'Allocated': ('2,466.147', 'MWh')}
    """
    n = len(kpis)
    fig, axes = plt.subplots(1, n, figsize=(fig_width, 1.5))
    if n == 1:
        axes = [axes]

    for ax, (label, (value, unit)) in zip(axes, kpis.items()):
        ax.text(0.5, 0.7, value, ha='center', va='center',
                fontsize=20, fontweight='bold', color='#2A2929',
                transform=ax.transAxes)
        ax.text(0.5, 0.25, f'{label} ({unit})', ha='center', va='center',
                fontsize=10, color='#897F78', transform=ax.transAxes)
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
        ax.axis('off')
        # Add subtle border
        for spine in ax.spines.values():
            spine.set_visible(True)
            spine.set_color('#e5e0db')
            spine.set_linewidth(0.5)

    fig.patch.set_facecolor('#f9f6f4')
    plt.tight_layout()
    return fig
```

### Demand line (scipy spline implementation note)

Use `scipy.interpolate.make_interp_spline(x, y, k=3)` to create the smooth curve. Set `zorder=10` to render on top of all bars. Use `solid_capstyle='round'` for rounded line caps. No markers (`solid_capstyle='round'`).

## Chart.js

### Key differences table

| Concept | Highcharts | Chart.js |
|---|---|---|
| Z-ordering | `zIndex: 10` (higher = front) | `order: 0` (lower = drawn later = front) |
| Stacking | `stacking: 'normal'` | `scales: { x: { stacked: true }, y: { stacked: true } }` |
| Bar spacing (stacked) | `groupPadding: 0`, `pointPadding: 0.1` | `categoryPercentage: 1.0`, `barPercentage: 0.8` (set on each bar dataset) |
| Bar spacing (simple) | `groupPadding: 0.3`, `pointPadding: 0` | `categoryPercentage: 0.4`, `barPercentage: 1.0` |
| Segment borders | `borderWidth: 0`, `borderRadius: 0` | `borderWidth: 0`, `borderRadius: 0` |
| Demand line | Same y-axis, `type: 'spline'` | Separate `type: 'line'` dataset with `stack: false` and `order: 0`. **Must** explicitly opt out of stacking — see § Gotchas |
| Grid | `gridLineDashStyle: 'Dot'` | `grid.borderDash: [2, 2]` — note: some Chart.js versions render this inconsistently; see § Gotchas for workaround |
| Font | Inherited from CSS | Must be loaded before canvas renders — use `document.fonts.ready` |

### Worked example: 5-dataset allocation chart

This is a complete Chart.js configuration for a Granular-style stacked bar + demand line chart with two technologies (solar, wind). Copy and adapt.

```javascript
// Assumes: <canvas id="chart"></canvas> in your HTML
// Assumes: Inter font loaded via <link> in <head>

document.fonts.ready.then(() => {
  const ctx = document.getElementById('chart').getContext('2d');

  // --- Data (validated with validate_chart_data.py before use) ---
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const demand =       [5000, 5000, 5000, 5000, 5000, 5000];
  // Same-resolution: each month has EITHER unallocated OR excess, not both
  const solarMatched = [1200, 1800, 2500, 3000, 3200, 3500];
  const windMatched  = [2800, 2500, 2200, 2000, 1800, 1200];
  const unallocated  = [1000,  700,  300,    0,    0,    0]; // demand gap
  const solarExcess  = [   0,    0,    0,  200,  400,  600];
  const windExcess   = [   0,    0,    0,  100,  200,  300];

  // Y-axis headroom: max(demand + total_excess) * 1.1
  const maxY = Math.max(...demand.map((d, i) =>
    d + solarExcess[i] + windExcess[i])) * 1.1;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        // --- Layer 1: Matched techs (bottom, saturated) ---
        {
          label: 'Solar',
          data: solarMatched,
          backgroundColor: '#FDCF77',  // TECH_COLORS.solar[0]
          borderWidth: 0,
          borderRadius: 0,
          categoryPercentage: 1.0,  // no gap between categories
          barPercentage: 0.8,       // slight horizontal padding between bars
          order: 3,          // higher order = drawn first = behind
          stack: 'stack',
        },
        {
          label: 'Wind',
          data: windMatched,
          backgroundColor: '#81D8B9',  // TECH_COLORS.wind[0]
          borderWidth: 0,
          borderRadius: 0,
          categoryPercentage: 1.0,
          barPercentage: 0.8,
          order: 3,
          stack: 'stack',
        },

        // --- Layer 2: Unallocated (hatched) ---
        // Chart.js doesn't natively support hatching.
        // Option A: use a canvas pattern (see below).
        // Option B: use a semi-transparent solid as an approximation.
        {
          label: 'Unallocated',
          data: unallocated,
          backgroundColor: createHatchPattern('#CEE7DF', '#FAFAFA'),
          borderWidth: 0,
          borderRadius: 0,
          categoryPercentage: 1.0,
          barPercentage: 0.8,
          order: 3,
          stack: 'stack',
        },

        // --- Layer 3: Excess techs (top, pastel) ---
        {
          label: 'Solar excess',
          data: solarExcess,
          backgroundColor: '#FEE0A7',  // TECH_COLORS.solar[1]
          borderWidth: 0,
          borderRadius: 0,
          categoryPercentage: 1.0,
          barPercentage: 0.8,
          order: 3,
          stack: 'stack',
        },
        {
          label: 'Wind excess',
          data: windExcess,
          backgroundColor: '#ADE6D1',  // TECH_COLORS.wind[1]
          borderWidth: 0,
          borderRadius: 0,
          categoryPercentage: 1.0,
          barPercentage: 0.8,
          order: 3,
          stack: 'stack',
        },

        // --- Demand line (on top of everything) ---
        // IMPORTANT: must set stack: false to avoid being stacked with bars
        {
          label: 'Demand',
          data: demand,
          type: 'line',
          borderColor: '#0F4974',
          borderWidth: 2,
          pointRadius: 0,       // no markers
          tension: 0.4,         // Catmull-Rom approximation
          fill: false,
          order: 0,             // lower order = drawn later = visually on top
          stack: false,         // CRITICAL: do NOT stack with bars
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { family: 'Inter', size: 10, weight: '500' },
            color: '#666666',
            padding: 16,
            usePointStyle: false,
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          border: { color: '#CED6E9' },
          ticks: { font: { family: 'Inter', size: 11 }, color: '#666666' },
        },
        y: {
          stacked: true,
          suggestedMax: maxY,
          grid: {
            color: 'rgba(0,0,0,0.2)',
            borderDash: [2, 2],   // dotted
            drawBorder: false,
          },
          border: { color: '#CED6E9' },
          ticks: { font: { family: 'Inter', size: 11 }, color: '#666666' },
          title: {
            display: true,
            text: 'MWh',
            font: { family: 'Inter', size: 9 },
            color: '#897F78',
            align: 'end',       // top of axis
          },
        },
      },
    },
  });
});

// --- Hatch pattern helper for Chart.js canvas ---
function createHatchPattern(stripeColor, bgColor) {
  const size = 8;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);
  // 45° diagonal stripe
  ctx.strokeStyle = stripeColor;
  ctx.lineWidth = 3;
  ctx.lineCap = 'square';
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.lineTo(size, 0);
  ctx.stroke();
  // Wrap-around stripe for seamless tiling
  ctx.beginPath();
  ctx.moveTo(-size, size);
  ctx.lineTo(size, -size);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 2 * size);
  ctx.lineTo(2 * size, 0);
  ctx.stroke();
  return ctx.createPattern(canvas, 'repeat');
}
```

### Gotchas

**Key Chart.js gotchas explained:**

- **`order` property**: Lower value = drawn later = visually in front. The demand line needs `order: 0` to appear on top; all bar datasets use `order: 3`.

- **`stack` property (CRITICAL)**: All bar datasets share the same `stack: 'stack'` key. The demand line **must** use `stack: false` to float independently. If you omit `stack: false` on a `type: 'line'` dataset inside a stacked bar chart, Chart.js will stack it on top of the bars — producing completely wrong y-values. Always set `stack: false` on the demand line.

- **`categoryPercentage` / `barPercentage` (CRITICAL)**: These control horizontal bar spacing and must be set on **every bar dataset** (not in `options`). For stacked allocation charts: `categoryPercentage: 1.0`, `barPercentage: 0.8`. Without these, Chart.js uses defaults (0.8 / 0.9) that create wider gaps than the Granular spec.

- **`tension: 0.4`**: Approximates Catmull-Rom spline smoothing. Adjust to taste — `0.3`–`0.5` is the right range.

- **Hatching**: Chart.js has no built-in hatch support. The `createHatchPattern()` helper creates a canvas-based pattern that matches the 8×8px, 3px stroke, 45° spec.

- **Dotted grid lines**: The spec requires dotted y-axis grid lines. Use `grid: { borderDash: [2, 2] }` on the y scale. In some Chart.js 4.x builds, `borderDash` on scale grids renders inconsistently. If dots don't appear, use this afterDatasetsDraw plugin as a fallback:

```javascript
const dottedGridPlugin = {
  id: 'dottedGrid',
  afterDatasetsDraw(chart) {
    const { ctx, chartArea: { left, right }, scales: { y } } = chart;
    ctx.save();
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    y.ticks.forEach((_, i) => {
      const yPos = y.getPixelForTick(i);
      ctx.beginPath();
      ctx.moveTo(left, yPos);
      ctx.lineTo(right, yPos);
      ctx.stroke();
    });
    ctx.restore();
  }
};
// Register: Chart.register(dottedGridPlugin) or pass in plugins array
```

## Plotly

### Template configuration

```python
import plotly.graph_objects as go
import plotly.io as pio

granular_template = go.layout.Template(
    layout=go.Layout(
        font=dict(family='Inter', color='#666666', size=11),
        title=dict(font=dict(family='Inter', size=18, color='#2A2929')),
        paper_bgcolor='#FBFAF9',
        plot_bgcolor='#FFFFFF',
        xaxis=dict(
            gridcolor='rgba(0,0,0,0.2)', griddash='dot', gridwidth=1,
            linecolor='#CED6E9', zerolinecolor='#CED6E9',
            tickfont=dict(color='#666666', size=11),
        ),
        yaxis=dict(
            gridcolor='rgba(0,0,0,0.2)', griddash='dot', gridwidth=1,
            linecolor='#CED6E9', zerolinecolor='#CED6E9',
            tickfont=dict(color='#666666', size=11),
            rangemode='tozero',  # Y-axis minimum: 0
        ),
        colorway=['#6EA1DD', '#57B06B', '#81D8B9', '#FDCF77', '#00988B', '#897F78'],
        legend=dict(orientation='h', yanchor='top', y=-0.15, xanchor='center', x=0.5,
                    font=dict(size=10)),
    )
)

pio.templates['granular'] = granular_template
pio.templates.default = 'granular'
```

### Hatched patterns in Plotly

```python
# Unallocated demand
go.Bar(x=dates, y=unallocated_values, name='Unallocated',
       marker=dict(color='#FAFAFA', pattern=dict(shape='/', fgcolor='#CEE7DF', size=8, solidity=0.4)))
# Excess unallocated
go.Bar(x=dates, y=excess_unalloc_values, name='Excess (unallocated)',
       marker=dict(color='#B9DFDC', pattern=dict(shape='/', fgcolor='#1FB084', size=8, solidity=0.4)))
# Excess allocated (solid, no pattern)
go.Bar(x=dates, y=excess_alloc_values, name='Excess', marker=dict(color='#1FB084'))
```

### Demand line trace

```python
def plotly_demand_trace(dates, values, name='Demand'):
    return go.Scatter(
        x=dates, y=values, name=name,
        mode='lines',
        line=dict(color='#0F4974', width=2, shape='spline', smoothing=1.3),
        marker=dict(size=0),
        legendrank=1,  # First in legend
    )
```

## SVG / HTML

### Hatched pattern defs

```html
<defs>
  <!-- Unallocated demand: green-grey stripes on near-white -->
  <pattern id="unallocated-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="8" height="8" fill="#FAFAFA"/>
    <line x1="0" y1="0" x2="0" y2="8" stroke="#CEE7DF" stroke-width="3" stroke-linecap="square"/>
  </pattern>
  <!-- Excess unallocated: green stripes on green-teal -->
  <pattern id="excess-unalloc-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="8" height="8" fill="#B9DFDC"/>
    <line x1="0" y1="0" x2="0" y2="8" stroke="#1FB084" stroke-width="3" stroke-linecap="square"/>
  </pattern>
</defs>

<rect fill="url(#unallocated-hatch)" ... />
<rect fill="url(#excess-unalloc-hatch)" ... />
```

---

# Part 3: Calculation Logic

This section covers how to generate correct chart data. Read this when creating sample/test data.

## How Matching & Excess Are Calculated

Understanding this is essential for rendering correct chart data. There are two calculation paths.

### Portfolio-level (aggregate supply vs demand)

Per time bin, matching and excess are calculated **per dimension group independently**. If you group by technology, then within each time bin Solar supply is compared only to Solar demand — there's no cross-technology redistribution:

```
solar_matching    = min(solar_supply, solar_demand)
solar_excess      = max(0, solar_supply − solar_demand)
solar_unmatched   = max(0, solar_demand − solar_supply)   # demand not met (shortfall)

wind_matching     = min(wind_supply, wind_demand)
wind_excess       = max(0, wind_supply − wind_demand)
wind_unmatched    = max(0, wind_demand − wind_supply)     # demand not met (shortfall)
```

Each technology's matching and excess is self-contained. Results are summed to the plotting resolution (e.g. hourly → monthly). Note that at each matching-resolution bin, a technology has either excess OR unallocated, never both (it's a simple min/max).

### Demand-level allocated (per-technology breakdown with proportional distribution)

This answers: "Of the supply allocated to my demand, how much matched and how much was excess — broken down by technology?"

1. **Classify same-period vs cross-period** — supply generated in the same matching-resolution bin as its demand is "same-period"; everything else is "cross-period".

2. **Calculate matching and excess at the aggregate level (all technologies pooled, no dimensions):**
```
total_matching = min(demand, same_period_allocated_supply)
total_excess   = max(0, same_period_allocated_supply − demand) + all_cross_period_supply
```
Same-period supply up to demand = matching. Same-period supply beyond demand = excess. All cross-period supply = always excess (generated in a different time bin).

3. **Proportionally distribute BOTH matching and excess across technologies using the same split:**
```
tech_matching = total_matching × (tech_allocated / total_allocated)
tech_excess   = total_excess   × (tech_allocated / total_allocated)
```

At the demand level, a technology's share of "matching" supply is simply its share of total allocation in that bin — it is NOT a per-technology supply-vs-demand comparison. Both matching and excess use the same proportional split, which guarantees `tech_matching + tech_excess = tech_allocated` for every group in every bin.

**Example:** Two devices allocated — Device A: 50 kWh, Device B: 150 kWh (200 kWh total). If total matching is 100 kWh and total excess is 100 kWh: Device A gets 25 kWh matching + 25 kWh excess = 50 kWh. Device B gets 75 kWh matching + 75 kWh excess = 150 kWh.

### Critical invariants for rendering

**The demand line is NOT the top of the bar.** It sits at the boundary between the gap categories and the excess block:

```
demand = matching + unallocated        (ALWAYS)
total_bar_height = matching + unallocated + excess
                 = demand + excess
```

The demand line's y-value equals `sum(all_tech_matching) + unallocated` for that time bin. Excess bars poke ABOVE the demand line. This is the key visual insight: the bar fills up to demand (matched + shortfall), then overshoots with excess.

**Matching score** (the headline KPI shown on dashboards):
```
matching_score = sum(matched) / sum(demand)
```
Expressed as a percentage (e.g. "89.4% of demand matched"). This is computed over the full time range, not per-bar.

When generating test/example data, ensure:
- `demand = sum(tech_matching for all techs) + unallocated`
- `excess = total_allocated_supply - matching` (only the oversupply portion)
- The demand spline passes through the bar at the matching↔excess boundary, NOT at the bar top

Other rules:
- You **cannot** assume excess "belongs to" one technology. The backend distributes it proportionally. If Solar is 60% of allocated supply in a bin, Solar gets 60% of the excess — regardless of which technology was actually over-allocated.
- `tech_matching + tech_excess = tech_allocated` — always. Guaranteed by the proportional split.
- Cross-period supply is **always** excess. If January supply is allocated to February demand, 100% is excess in the February bin.
- When rendering a stacked bar, each technology therefore has both a matching segment (saturated colour) and an excess segment (lighter pastel colour). These are stacked separately — matching in the bottom block, excess in the top block — not adjacent within the same technology band.

### Data Validation Script

See § Data Validation (mandatory) at the top of this file for usage and the four validation rules.

## Matching Resolution vs Plotting Resolution

The calculation happens at two distinct time resolutions, and the relationship between them determines whether a single bar on the chart can show both excess and shortfall simultaneously.

1. **Matching resolution** — the granularity at which supply is compared to demand. This is the resolution of the underlying data (e.g., half-hourly, hourly). At each matching-resolution bin, supply and demand are compared via a simple min/max: the result is either excess OR shortfall, never both.

2. **Plotting resolution** — the granularity of the x-axis on the chart (e.g., hourly, monthly). The matching, excess, and shortfall values from all matching-resolution bins within each plotting bin are **summed** before rendering.

**Why this matters for rendering:**

- **Plotting resolution > matching resolution** (e.g., monthly bars from hourly data): A single plotting bin aggregates many matching-resolution bins. Some hours may have excess (supply > demand), others shortfall (demand > supply). When summed, the month correctly shows both excess and shortfall — they don't cancel out because classification happened at the hourly level before aggregation.

- **Plotting resolution = matching resolution** (e.g., hourly bars from hourly data): Each bar is both the comparison unit and the display unit. Each bar is a single min/max result — it shows **either** excess **or** shortfall, never both. You will never see unallocated and excess in the same bar.

**Default assumption:** Unless the plotting resolution is explicitly specified as different from the data resolution, assume they are the same. This means excess and shortfall will be mutually exclusive within each bar/point on the chart.

**When generating example/test data:** If the x-axis is hourly and the data is hourly, each hour should have EITHER excess segments OR unallocated segments, never both. If the x-axis is monthly and the data is hourly, each month can have both. Getting this wrong produces charts that are visually plausible but logically impossible.
