import StatePanel from './StatePanel'

export default {
  id: 'economy',
  name: 'Economy',
  icon: '\u{1F4BC}',
  description: 'GDP, Employment & Income',
  colorScale: ['#e8f5e9', '#c8e6c9', '#a5d6a7', '#81c784', '#66bb6a', '#4caf50', '#2e7d32'],
  getMetric: (state) => state?.income ?? 0,
  formatMetric: (val) => val > 0 ? '$' + val.toLocaleString() : 'No data',
  metricLabel: 'Median Income',
  StatePanel,
}
