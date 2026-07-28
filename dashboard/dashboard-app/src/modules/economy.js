// Economy module — state-level employment, GDP, trade & CPI.
//
// This module is intentionally a SAMPLE: public/economy.json contains
// synthetic placeholder numbers, not real BLS/BEA data (see its metadata).
// It exists to prove the template works for a dataset with a completely
// different shape than demographics.js — swap the data pipeline in
// scripts/download_economy.py + clean_economy.py to make it real.

const SECTOR_LABELS = {
  manufacturing: 'Manufacturing',
  healthcare: 'Healthcare',
  retail: 'Retail',
  government: 'Government',
  professional: 'Professional Services',
  other: 'Other',
}

const SECTOR_COLORS = {
  manufacturing: '#1a5bd6',
  healthcare: '#0f9d6c',
  retail: '#f5b02e',
  government: '#8e44ad',
  professional: '#378add',
  other: '#555550',
}

const pct = v => `${v}%`

export default {
  id: 'economy',
  label: 'Economy',
  icon: '📈',
  owner: 'Vignesh',

  dataUrl: '/economy.json',

  title: 'State Economic Indicators',
  subtitle: 'Click any state to view employment, GDP, trade & prices — sample data',
  source: 'Sample data for template demo — swap in BLS/BEA via scripts/download_economy.py',

  mapMetric: {
    getValue: state => state.unemployment['2024'],
    format: v => `${v}%`,
    label: 'Unemployment Rate',
    // Low-is-good metric, so invert the scale (light = low unemployment).
    colors: ['#0c447c', '#1a5bd6', '#378add', '#6baed6', '#94c8eb', '#c5dff5', '#e6f1fb'],
  },

  summary(states) {
    const list = Object.values(states)
    const totalGdp = list.reduce((s, x) => s + x.gdp_millions_2024, 0)
    const avgUnemployment = (list.reduce((s, x) => s + x.unemployment['2024'], 0) / list.length).toFixed(1)
    const totalLaborForce = list.reduce((s, x) => s + x.labor_force_2024, 0)
    const avgGdpGrowth = (list.reduce((s, x) => s + x.gdp_growth_pct, 0) / list.length).toFixed(1)
    return [
      { label: 'Total GDP (2024)', value: `$${(totalGdp / 1_000_000).toFixed(1)}T`, sub: 'Sum of state GDP' },
      { label: 'Avg. Unemployment', value: `${avgUnemployment}%`, sub: 'National average' },
      { label: 'Labor Force', value: `${(totalLaborForce / 1_000_000).toFixed(0)}M`, sub: 'All 50 states + DC' },
      { label: 'Avg. GDP Growth', value: `${avgGdpGrowth}%`, sub: 'Year over year' },
    ]
  },

  panel: {
    hero: {
      getValue: state => state.unemployment['2024'],
      format: v => `${v}%`,
      label: 'Unemployment Rate (2024)',
    },
    badge: {
      getValue: state => -(state.unemployment['2024'] - state.unemployment['2021']).toFixed(1),
      suffix: 'pts vs. 2021',
    },
    rankBadge: { getValue: state => state.gdp_rank },
    quickStats: [
      { label: 'GDP Rank', getValue: state => state.gdp_rank, format: v => `#${v}`, accent: 'gold' },
      { label: 'GDP (2024)', getValue: state => state.gdp_millions_2024, format: v => `$${(v / 1000).toFixed(1)}B` },
      { label: 'Labor Force', getValue: state => state.labor_force_2024, format: v => v.toLocaleString() },
    ],
    sections: [
      {
        title: 'Unemployment Rate',
        type: 'timeseries',
        getSeries: state => state.unemployment,
        color: '#1a5bd6',
        valueFormat: v => `${v}%`,
        axisFormat: v => `${v}%`,
      },
      {
        title: 'Trade (2024, $M)',
        type: 'flow',
        getRows: state => [
          { label: 'Exports', value: state.trade_2024.exports },
          { label: 'Imports', value: -state.trade_2024.imports },
        ],
        netLabel: 'Trade Balance',
        format: v => `$${Math.abs(v).toLocaleString()}M`,
      },
      {
        title: 'Regional CPI',
        type: 'timeseries',
        getSeries: state => state.cpi_regional,
        color: '#d64545',
        valueFormat: v => v.toFixed(1),
        axisFormat: v => v.toFixed(0),
      },
      {
        title: 'Employment by Sector',
        type: 'categories',
        getGroups: state => Object.keys(SECTOR_LABELS).map(key => ({
          key,
          label: SECTOR_LABELS[key],
          value: state.sector_employment[key],
          color: SECTOR_COLORS[key],
        })),
        getTotal: state => state.sector_employment_total,
      },
    ],
  },

  views: ['map', 'ranking'],

  ranking: {
    columns: [
      { key: 'rank', label: '#', getValue: s => s.gdp_rank },
      { key: 'name', label: 'State', getValue: s => s.name, format: (v, s) => `${s.abbr} — ${v}` },
      { key: 'gdp', label: 'GDP (2024)', getValue: s => s.gdp_millions_2024, format: v => `$${(v / 1000).toFixed(1)}B` },
      { key: 'growth', label: 'GDP Growth', getValue: s => s.gdp_growth_pct, format: pct },
      { key: 'unemployment', label: 'Unemployment', getValue: s => s.unemployment['2024'], format: pct },
      { key: 'labor', label: 'Labor Force', getValue: s => s.labor_force_2024, format: v => v.toLocaleString() },
    ],
  },
}
