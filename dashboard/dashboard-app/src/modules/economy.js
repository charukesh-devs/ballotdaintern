// Economy module — real BEA/BLS data extracted from economy_employment_workbook.xlsx

const money = v => `$${v.toLocaleString()}`
const billions = v => `$${(v / 1000).toFixed(1)}B`
const pct = v => `${v}%`

export default {
  id: 'economy',
  label: 'Economy',
  icon: '📈',
  owner: 'Vignesh',

  dataUrl: '/economy.json',

  title: 'U.S. State Economic Indicators',
  subtitle: 'Click any state to view GDP, income & unemployment breakdown',
  source: 'Data: U.S. Bureau of Economic Analysis (BEA) & Bureau of Labor Statistics (BLS)',

  // Map coloring: GDP by state (higher = darker)
  mapMetric: {
    getValue: state => state.gdp_latest,
    format: v => `$${(v / 1000).toFixed(1)}B`,
    label: 'GDP',
    colors: ['#e8f5e9', '#c8e6c9', '#a5d6a7', '#81c784', '#66bb6a', '#4caf50', '#2e7d32'],
  },

  summary(states) {
    const list = Object.values(states)
    const totalGdp = list.reduce((s, x) => s + (x.gdp_latest || 0), 0)
    const avgUnemployment = (list.reduce((s, x) => {
      const vals = Object.values(x.unemployment || {})
      return s + (vals.length ? vals[vals.length - 1] : 0)
    }, 0) / list.length).toFixed(1)
    const avgGrowth = (list.reduce((s, x) => s + (x.gdp_growth_pct || 0), 0) / list.length).toFixed(1)
    const avgPerCapita = Math.round(list.reduce((s, x) => s + (x.per_capita_income_latest || 0), 0) / list.length)
    return [
      { label: 'Total GDP (2024)', value: `$${(totalGdp / 1_000_000).toFixed(1)}T`, sub: 'Sum of state GDP' },
      { label: 'Avg. Unemployment', value: `${avgUnemployment}%`, sub: 'Latest available year' },
      { label: 'Avg. GDP Growth', value: `${avgGrowth}%`, sub: 'Year over year' },
      { label: 'Avg. Per Capita Income', value: `$${avgPerCapita.toLocaleString()}`, sub: 'Personal income per capita' },
    ]
  },

  panel: {
    hero: {
      getValue: state => state.gdp_latest,
      format: v => `$${(v / 1000).toFixed(1)}B`,
      label: 'GDP (2024)',
    },
    badge: {
      getValue: state => state.gdp_growth_pct,
      suffix: '% growth',
    },
    rankBadge: { getValue: state => state.gdp_rank },
    quickStats: [
      { label: 'GDP Rank', getValue: state => state.gdp_rank, format: v => `#${v}`, accent: 'gold' },
      { label: 'Per Capita Income', getValue: state => state.per_capita_income_latest, format: money },
      {
        label: 'Unemployment',
        getValue: state => {
          const vals = Object.values(state.unemployment || {})
          return vals.length ? vals[vals.length - 1] : 0
        },
        format: pct,
      },
    ],
    sections: [
      {
        title: 'GDP by Year ($M)',
        type: 'timeseries',
        getSeries: state => state.gdp_millions,
        color: '#2e7d32',
        valueFormat: v => `$${(v / 1000).toFixed(0)}B`,
        axisFormat: v => `$${(v / 1000).toFixed(0)}B`,
      },
      {
        title: 'Unemployment Rate',
        type: 'timeseries',
        getSeries: state => state.unemployment,
        color: '#1a5bd6',
        valueFormat: v => `${v}%`,
        axisFormat: v => `${v}%`,
      },
      {
        title: 'Per Capita Income ($)',
        type: 'timeseries',
        getSeries: state => state.per_capita_income,
        color: '#d64545',
        valueFormat: v => `$${v.toLocaleString()}`,
        axisFormat: v => `$${(v / 1000).toFixed(0)}K`,
      },
      {
        title: 'Personal Income ($M)',
        type: 'timeseries',
        getSeries: state => state.personal_income_millions,
        color: '#8e44ad',
        valueFormat: v => `$${(v / 1000).toFixed(1)}B`,
        axisFormat: v => `$${(v / 1000).toFixed(0)}B`,
      },
    ],
  },

  views: ['map', 'ranking', 'trend'],

  ranking: {
    columns: [
      { key: 'rank', label: '#', getValue: s => s.gdp_rank },
      { key: 'name', label: 'State', getValue: s => s.name, format: (v, s) => `${s.abbr} — ${v}` },
      { key: 'gdp', label: 'GDP (2024)', getValue: s => s.gdp_latest, format: billions },
      { key: 'growth', label: 'GDP Growth', getValue: s => s.gdp_growth_pct, format: pct },
      { key: 'percapita', label: 'Per Capita Income', getValue: s => s.per_capita_income_latest, format: money },
      {
        key: 'unemployment', label: 'Unemployment', getValue: s => {
          const vals = Object.values(s.unemployment || {})
          return vals.length ? vals[vals.length - 1] : 0
        }, format: pct,
      },
    ],
  },

  trend: {
    title: 'GDP Trend — Top 10 States (2021–2025)',
    periods: ['2021', '2022', '2023', '2024', '2025'],
    getSeriesValue: (state, period) => state.gdp_millions?.[period] || 0,
    rankBy: state => state.gdp_latest,
    axisFormat: v => `$${(v / 1000).toFixed(0)}B`,
  },
}
