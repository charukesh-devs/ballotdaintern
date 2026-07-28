// Demographics module — U.S. Census population, age, race & migration data.
// This is the reference module: every other module should follow this shape.

const RACE_COLORS = {
  white: '#1a5bd6',
  black: '#d64545',
  hispanic: '#f5b02e',
  asian: '#0f9d6c',
  aian: '#8e44ad',
  nhpi: '#e67e22',
  some_other: '#95a5a6',
  two_plus: '#378add',
}

const RACE_LABELS = {
  white: 'White',
  black: 'Black',
  hispanic: 'Hispanic',
  asian: 'Asian',
  aian: 'Native American',
  nhpi: 'Pacific Islander',
  some_other: 'Some Other Race',
  two_plus: 'Two+ Races',
}

const money = v => `$${v.toLocaleString()}`

export default {
  id: 'demographics',
  label: 'Demographics',
  icon: '🧑\u200d🤝\u200d🧑',

  // Where the per-state JSON lives (fetched at runtime from /public).
  dataUrl: '/demographics.json',

  title: 'U.S. Census Demographics',
  subtitle: 'Click any state to view its demographics breakdown',
  source: 'Data: U.S. Census Bureau — PEP 2020–2023 & ACS 1-Year 2023',

  // Drives the choropleth fill + tooltip on the map.
  mapMetric: {
    getValue: state => state.population['2023'],
    format: v => v.toLocaleString(),
    label: 'Population',
    colors: ['#e6f1fb', '#c5dff5', '#94c8eb', '#6baed6', '#378add', '#1a5bd6', '#0c447c'],
  },

  // National-level cards shown above the map.
  summary(states) {
    const list = Object.values(states)
    const totalPop = list.reduce((s, x) => s + x.population['2023'], 0)
    const avgGrowth = (list.reduce((s, x) => s + x.growth_pct, 0) / list.length).toFixed(1)
    const avgIncome = Math.round(list.reduce((s, x) => s + x.income, 0) / list.length)
    const fmt = n => {
      if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B'
      if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
      if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
      return n.toString()
    }
    return [
      { label: 'Total Population (2023)', value: fmt(totalPop), sub: 'Across 50 states + DC' },
      { label: 'States & Territories', value: list.length, sub: 'Including D.C.' },
      { label: 'Avg. Growth (2020–23)', value: `${avgGrowth}%`, sub: 'National average' },
      { label: 'Avg. Median Income', value: `$${fmt(avgIncome)}`, sub: 'Household, ACS 2023' },
    ]
  },

  // The detail panel shown when a state is clicked. StatePanel.jsx renders
  // this generically — no demographics-specific code lives there.
  panel: {
    hero: {
      getValue: state => state.population['2023'],
      format: v => v.toLocaleString(),
      label: 'Population (2023)',
    },
    badge: {
      getValue: state => state.growth_pct,
      suffix: 'since 2020',
    },
    rankBadge: { getValue: state => state.population_rank },
    quickStats: [
      { label: 'National Rank', getValue: state => state.population_rank, format: v => `#${v}`, accent: 'gold' },
      { label: 'Median Income', getValue: state => state.income, format: money },
      { label: 'Births (2023)', getValue: state => state.births_2023, format: v => v.toLocaleString() },
    ],
    sections: [
      {
        title: 'Population Growth',
        type: 'timeseries',
        getSeries: state => state.population,
        color: '#d99511',
        valueFormat: v => (v / 1_000_000).toFixed(1) + 'M',
        axisFormat: v => (v / 1_000_000).toFixed(0) + 'M',
      },
      {
        title: 'Migration (2023)',
        type: 'flow',
        getRows: state => [
          { label: 'Domestic', value: state.domestic_migration_2023 },
          { label: 'International', value: state.intl_migration_2023 },
        ],
        netLabel: 'Net Migration',
      },
      {
        title: 'Age Distribution',
        type: 'bars',
        getGroups: state => [
          { label: 'Under 18', value: state.age.under_18 },
          { label: '18–24', value: state.age['18_to_24'] },
          { label: '25–44', value: state.age['25_to_44'] },
          { label: '45–64', value: state.age['45_to_64'] },
          { label: '65+', value: state.age['65_plus'] },
        ],
        getTotal: state => state.age.total,
      },
      {
        title: 'Race & Ethnicity',
        type: 'categories',
        getGroups: state => Object.keys(RACE_LABELS).map(key => ({
          key,
          label: RACE_LABELS[key],
          value: state.race[key],
          color: RACE_COLORS[key],
        })),
        getTotal: state => state.race.total,
      },
    ],
  },

  // Optional secondary views (see ModuleViews in App.jsx).
  views: ['map', 'ranking', 'trend'],

  ranking: {
    columns: [
      { key: 'rank', label: '#', getValue: s => s.population_rank },
      { key: 'name', label: 'State', getValue: s => s.name, format: (v, s) => `${s.abbr} — ${v}` },
      { key: 'population', label: 'Population', getValue: s => s.population['2023'], format: v => v.toLocaleString() },
      { key: 'growth', label: 'Growth', getValue: s => s.growth_pct, format: v => `${v >= 0 ? '+' : ''}${v}%` },
      { key: 'income', label: 'Median Income', getValue: s => s.income, format: money },
      { key: 'under18', label: 'Under 18', getValue: s => s.age.under_18 / s.age.total, format: v => `${(v * 100).toFixed(1)}%` },
      { key: '65plus', label: '65+', getValue: s => s.age['65_plus'] / s.age.total, format: v => `${(v * 100).toFixed(1)}%` },
    ],
  },

  trend: {
    title: 'Population Trend — Top 10 States (2020–2023)',
    periods: ['2020', '2021', '2022', '2023'],
    getSeriesValue: (state, period) => state.population[period],
    rankBy: state => state.population['2023'],
    axisFormat: v => (v / 1_000_000).toFixed(0) + 'M',
  },
}
