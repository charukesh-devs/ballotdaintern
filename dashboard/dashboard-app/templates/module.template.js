/**
 * Module Template
 *
 * Copy this file to src/modules/yourmodule.js and fill in the fields below.
 * Then register it in src/modules/registry.js with a single import.
 *
 * Every field marked REQUIRED must be provided. Fields marked OPTIONAL
 * can be left undefined and the dashboard will skip them.
 *
 * The dashboard components are generic — they call YOUR accessor functions
 * with the state record from your JSON file. You never write JSX.
 */

const RACE_COLORS = {
  // REQUIRED: one color per category, matching the keys in getGroups()
  white: '#1a5bd6',
  black: '#d64545',
  hispanic: '#f5b02e',
  asian: '#0f9d6c',
}

const RACE_LABELS = {
  white: 'White',
  black: 'Black',
  hispanic: 'Hispanic',
  asian: 'Asian',
}

export default {
  // ── Identity ──────────────────────────────────────────────────────────
  id: 'yourmodule',                    // REQUIRED: unique lowercase id
  label: 'Your Module',                // REQUIRED: display name for tabs
  icon: '📊',                          // REQUIRED: emoji for tab

  // ── Data ──────────────────────────────────────────────────────────────
  dataUrl: '/yourdata.json',           // REQUIRED: path to per-state JSON in public/

  // ── Header ────────────────────────────────────────────────────────────
  title: 'Your Module Title',          // REQUIRED: shown in header area
  subtitle: 'Click any state to view details',  // REQUIRED
  source: 'Data: Your Agency Name',    // REQUIRED: source attribution

  // ── Map Configuration ─────────────────────────────────────────────────
  // REQUIRED: drives choropleth fill + tooltip
  mapMetric: {
    getValue: (state) => state.your_field ?? 0,    // REQUIRED
    format: (v) => v.toLocaleString(),              // REQUIRED
    label: 'Your Metric Label',                     // REQUIRED: shown in tooltip
    colors: ['#e8f5e9', '#c8e6c9', '#a5d6a7', '#81c784', '#66bb6a', '#4caf50', '#2e7d32'],
  },

  // ── Summary Cards (OPTIONAL) ──────────────────────────────────────────
  // Shown above the map
  summary(states) {
    const list = Object.values(states)
    const total = list.reduce((s, x) => s + (x.your_field ?? 0), 0)
    return [
      { label: 'Total', value: total.toLocaleString(), sub: 'Across all states' },
    ]
  },

  // ── State Detail Panel ────────────────────────────────────────────────
  // REQUIRED: defines what the right panel shows when a state is clicked
  panel: {
    hero: {
      getValue: (state) => state.your_field ?? 0,
      format: (v) => v.toLocaleString(),
      label: 'Your Metric (Year)',
    },
    badge: {
      getValue: (state) => state.growth_pct ?? 0,
      suffix: 'since 2020',
    },
    rankBadge: { getValue: (state) => state.rank },
    quickStats: [
      { label: 'Rank', getValue: (s) => s.rank, format: (v) => `#${v}`, accent: 'gold' },
    ],
    sections: [
      {
        title: 'Your Section Title',
        type: 'bars',                    // one of: timeseries, flow, bars, categories
        getGroups: (state) => [
          { label: 'Category A', value: state.cat_a ?? 0 },
          { label: 'Category B', value: state.cat_b ?? 0 },
        ],
        getTotal: (state) => state.total ?? 0,
      },
    ],
  },

  // ── Ranking Table (OPTIONAL) ──────────────────────────────────────────
  ranking: {
    columns: [
      { key: 'rank', label: '#', getValue: (s) => s.rank },
      { key: 'name', label: 'State', getValue: (s) => s.name },
      { key: 'value', label: 'Value', getValue: (s) => s.your_field ?? 0, format: (v) => v.toLocaleString() },
    ],
  },

  // ── Trend Chart (OPTIONAL) ────────────────────────────────────────────
  trend: {
    title: 'Trend Title — Top 10 States',
    periods: ['2020', '2021', '2022', '2023'],
    getSeriesValue: (state, period) => state.population?.[period] ?? 0,
    rankBy: (state) => state.population?.['2023'] ?? 0,
    axisFormat: (v) => (v / 1_000_000).toFixed(0) + 'M',
  },
}
