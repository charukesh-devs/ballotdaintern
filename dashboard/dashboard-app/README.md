# America250 Dashboard — Module Integration Guide

This document is designed to be read by both humans and LLMs. It contains the exact specifications needed to add a new data module to the America250 dashboard without modifying any component code.

## Architecture

The dashboard is a React + Vite app at `dashboard/dashboard-app/`. It renders a tabbed interface where each tab represents a data domain (demographics, economy, etc.). All rendering is handled by **generic components** — module authors never write JSX. You only write a **config file** that exports accessor functions.

### Key principle

**One file per module. One import in registry. Zero component changes.**

```
src/modules/yourmodule.js   ← YOU create this (config only)
src/modules/registry.js     ← YOU add one import + one array entry
public/yourmodule.json      ← YOU create this (per-state data)
```

### How it works

1. `App.jsx` imports `modules` from `src/modules/registry.js`
2. Registry exports an array of module config objects
3. When a tab is clicked, `App.jsx` fetches the module's `dataUrl` JSON
4. Generic components (`USMap`, `StatePanel`, `SummaryCards`, `StateRanking`, `TrendChart`) read the module config and call its accessor functions with state data
5. No component code references any specific domain

### File map

```
dashboard-app/
├── src/
│   ├── App.jsx                          # Main layout (DO NOT MODIFY for new modules)
│   ├── App.css                          # Styles
│   ├── components/
│   │   ├── USMap.jsx                     # Choropleth map (generic)
│   │   ├── StatePanel.jsx                # Detail panel (generic, reads module.panel)
│   │   ├── SummaryCards.jsx              # Summary cards above map (generic)
│   │   ├── StateRanking.jsx              # Ranking table (generic)
│   │   ├── TrendChart.jsx                # Line chart (generic)
│   │   ├── ModuleTabs.jsx                # Tab bar (generic)
│   │   ├── BarBreakdown.jsx              # Horizontal bar breakdown
│   │   ├── CategoryBreakdown.jsx         # Donut/pie chart breakdown
│   │   ├── FlowCompare.jsx               # Positive/negative flow comparison
│   │   ├── PeriodScrubber.jsx            # Time period selector
│   │   └── TimeSeriesChart.jsx           # Line time series
│   └── modules/
│       ├── registry.js                   # ← EDIT: add import + array entry
│       ├── demographics.js               # Reference module (Sai)
│       ├── economy.js                    # Sample module (Vignesh)
│       └── geography.js                  # ← YOU CREATE: yourmodule.js
├── public/
│   ├── demographics.json                 # Sai's data
│   ├── economy.json                      # Vignesh's data
│   ├── yourmodule.json                   # ← YOU CREATE: your data
│   └── us-states.json                    # TopoJSON (DO NOT MODIFY)
├── templates/
│   ├── module.template.js                # Copy this as your starting point
│   ├── metadata.template.json            # JSON Schema for dataset metadata
│   ├── download.template.py              # Python download script template
│   └── CONTRIBUTING.md                   # Human-readable guide
├── core/                                 # Shared utilities
├── verify/
│   ├── verify_all.mjs                    # Run: npm run verify
│   └── verify_modules.mjs                # Module accessor checker
└── package.json
```

## Step-by-step: Adding a Module

### Step 1: Create your JSON data file

Create `public/yourmodule.json` with this exact structure:

```json
{
  "metadata": {
    "title": "Your Module Title",
    "sources": ["Agency Name — https://official-source.gov"],
    "generated": "2026-07-25"
  },
  "states": {
    "01": {
      "name": "Alabama",
      "abbr": "AL",
      "fips": "01",
      "your_metric": 12345,
      "another_metric": 67.8,
      "nested_data": {
        "key1": 100,
        "key2": 200
      },
      "timeseries": {
        "2020": 10000,
        "2021": 10500,
        "2022": 11000,
        "2023": 11500
      }
    },
    "02": {
      "name": "Alaska",
      "abbr": "AK",
      "fips": "02",
      "your_metric": 6789
    }
  }
}
```

**JSON requirements:**
- Top-level key: `states`
- Each state keyed by 2-digit FIPS code (`"01"` through `"56"` + `"11"` for DC = 51 entries)
- Every state MUST have: `name`, `abbr`, `fips`
- All other fields are your domain data
- Use nested objects for grouped data (`timeseries`, `by_age`, etc.)
- Values can be numbers, strings, or nested objects — the config maps accessors to them

### Step 2: Create your module config

Copy the template:

```bash
cp templates/module.template.js src/modules/yourmodule.js
```

Then edit `src/modules/yourmodule.js`. Here is the exact shape with all fields:

```javascript
// YourModule description comment

// Optional: define color maps for categorical data
const MY_COLORS = {
  category_a: '#1a5bd6',
  category_b: '#d64545',
}

const MY_LABELS = {
  category_a: 'Category A',
  category_b: 'Category B',
}

export default {
  // ── Identity (all REQUIRED) ──────────────────────────────────────────
  id: 'yourmodule',              // unique lowercase, matches JSON filename
  label: 'Your Module',          // display name in tab
  icon: '📊',                    // emoji in tab
  owner: 'YourName',             // team member responsible

  // ── Data (REQUIRED) ──────────────────────────────────────────────────
  dataUrl: '/yourmodule.json',   // path in public/ directory

  // ── Header (all REQUIRED) ────────────────────────────────────────────
  title: 'Your Module Title',
  subtitle: 'Click any state to view details',
  source: 'Data: U.S. Agency Name — https://source.gov',

  // ── Map metric (REQUIRED) ────────────────────────────────────────────
  mapMetric: {
    getValue: (state) => state.your_metric ?? 0,       // REQUIRED
    format: (v) => v.toLocaleString(),                  // REQUIRED
    label: 'Your Metric',                               // REQUIRED: tooltip label
    colors: ['#e8f5e9','#c8e6c9','#a5d6a7','#81c784','#66bb6a','#4caf50','#2e7d32'],  // REQUIRED: 7 colors, light→dark
  },

  // ── Summary cards (OPTIONAL) ─────────────────────────────────────────
  // Returned array renders as cards above the map
  summary(states) {
    const list = Object.values(states)
    const total = list.reduce((s, x) => s + (x.your_metric ?? 0), 0)
    return [
      { label: 'Total', value: total.toLocaleString(), sub: 'Across all states' },
    ]
  },

  // ── Detail panel (REQUIRED) ──────────────────────────────────────────
  panel: {
    hero: {                                           // REQUIRED
      getValue: (state) => state.your_metric ?? 0,
      format: (v) => v.toLocaleString(),
      label: 'Your Metric (Year)',
    },
    badge: {                                          // OPTIONAL
      getValue: (state) => state.growth_pct ?? 0,
      suffix: 'since 2020',
    },
    rankBadge: { getValue: (state) => state.rank },   // OPTIONAL
    quickStats: [                                     // OPTIONAL: array
      { label: 'Rank', getValue: (s) => s.rank, format: (v) => `#${v}`, accent: 'gold' },
    ],
    sections: [                                       // OPTIONAL: array of section objects
      // Section type: timeseries
      {
        title: 'Metric Over Time',
        type: 'timeseries',
        getSeries: (state) => state.timeseries,      // returns { year: value, ... }
        color: '#1a5bd6',
        valueFormat: (v) => v.toLocaleString(),
        axisFormat: (v) => (v / 1000).toFixed(0) + 'K',
      },
      // Section type: flow
      {
        title: 'Inflow vs Outflow',
        type: 'flow',
        getRows: (state) => [
          { label: 'Inflow', value: state.inflow },
          { label: 'Outflow', value: -state.outflow },
        ],
        netLabel: 'Net',
        format: (v) => Math.abs(v).toLocaleString(),
      },
      // Section type: bars
      {
        title: 'Distribution',
        type: 'bars',
        getGroups: (state) => [
          { label: 'Group A', value: state.group_a },
          { label: 'Group B', value: state.group_b },
        ],
        getTotal: (state) => state.total,
      },
      // Section type: categories (donut chart)
      {
        title: 'Breakdown',
        type: 'categories',
        getGroups: (state) => Object.keys(MY_LABELS).map(key => ({
          key,
          label: MY_LABELS[key],
          value: state.categories[key],
          color: MY_COLORS[key],
        })),
        getTotal: (state) => state.categories_total,
      },
    ],
  },

  // ── Views (OPTIONAL) ─────────────────────────────────────────────────
  // Which tabs appear: 'map', 'ranking', 'trend'
  views: ['map', 'ranking', 'trend'],

  // ── Ranking table (OPTIONAL, requires views: 'ranking') ──────────────
  ranking: {
    columns: [
      { key: 'rank', label: '#', getValue: (s) => s.rank },
      { key: 'name', label: 'State', getValue: (s) => s.name, format: (v, s) => `${s.abbr} — ${v}` },
      { key: 'value', label: 'Value', getValue: (s) => s.your_metric, format: (v) => v.toLocaleString() },
    ],
  },

  // ── Trend chart (OPTIONAL, requires views: 'trend') ──────────────────
  trend: {
    title: 'Trend — Top 10 States',
    periods: ['2020', '2021', '2022', '2023'],       // array of period keys
    getSeriesValue: (state, period) => state.timeseries?.[period] ?? 0,
    rankBy: (state) => state.timeseries?.['2023'] ?? 0,
    axisFormat: (v) => (v / 1_000_000).toFixed(0) + 'M',
  },
}
```

### Step 3: Register in registry.js

Edit `src/modules/registry.js` — add two lines:

```javascript
import demographics from './demographics.js'
import economy from './economy.js'
import yourmodule from './yourmodule.js'        // ADD THIS

const modules = [
  demographics,
  economy,
  yourmodule,                                   // ADD THIS
]

export default modules
```

**That's it.** No other files change.

### Step 4: Verify

```bash
cd dashboard-app
npm run verify
```

This runs `verify/verify_modules.mjs` which:
- Loads your module config
- Loads your `public/yourmodule.json`
- Calls every accessor function against every state in your data
- Reports PASS/FAIL for each accessor
- Catches field-name typos that lint/build cannot detect

### Step 5: Test locally

```bash
npm run dev
```

Open http://localhost:5173, click your tab, verify map + panels render.

## Section Types Reference

| Type | Input | Renders | Required fields |
|------|-------|---------|----------------|
| `timeseries` | `getSeries(state)` returns `{period: value}` | Line chart | `getSeries`, `color` |
| `flow` | `getRows(state)` returns `[{label, value}]` | Positive/negative bars | `getRows`, `netLabel` |
| `bars` | `getGroups(state)` returns `[{label, value}]` + `getTotal` | Horizontal bars | `getGroups`, `getTotal` |
| `categories` | `getGroups(state)` returns `[{key, label, value, color}]` + `getTotal` | Donut chart | `getGroups`, `getTotal` |

## Accessor Function Contract

Every accessor receives a **state object** from your JSON. The state object always has `name`, `abbr`, `fips` plus whatever fields you defined.

```javascript
// If your JSON has:
{
  "states": {
    "01": {
      "name": "Alabama",
      "abbr": "AL",
      "fips": "01",
      "crop_yield": 45.2,
      "by_crop": { "corn": 100, "wheat": 200 }
    }
  }
}

// Then your accessor can be:
getValue: (state) => state.crop_yield
getGroups: (state) => [
  { label: 'Corn', value: state.by_crop.corn, color: '#f5b02e' },
  { label: 'Wheat', value: state.by_crop.wheat, color: '#1a5bd6' },
]
```

## Common Pitfalls

1. **FIPS codes must be strings** — `"01"` not `1`
2. **All 51 entries required** — 50 states + DC (`"11"`)
3. **`getValue` must return a number** — use `?? 0` fallback
4. **`format` receives the output of `getValue`** — format it for display
5. **`colors` array must have exactly 7 entries** — light to dark
6. **Section titles must be unique** within a module
7. **`getSeries` must return an object** with period keys matching `trend.periods`
8. **Never use `null` as a value** — use `0` or `undefined` with `??` fallback

## Verification Commands

| Command | What it checks |
|---------|----------------|
| `npm run verify` | Full suite: repository health, raw data, modules, checksums, sources, duplicates |
| `npm run verify:quick` | Module accessors only (fast) |
| `npm run build` | Vite production build succeeds |
| `npm run lint` | Oxlint passes |

## Data Pipeline (Optional)

If you need to download and process raw data, use the templates in `templates/`:

```bash
cp templates/download.template.py scripts/download_yourmodule.py
# Edit YOUR_DATASETS list and MODULE_ID

cp templates/metadata.template.json raw/yourmodule/metadata.json
# Fill in dataset details
```

Then create a clean script and update `main.py` to include your pipeline.
