import StatePanel from './StatePanel'

export default {
  id: 'demographics',
  name: 'Demographics',
  icon: '\u{1F4CA}',
  description: 'Population, Age, Race & Income',
  colorScale: ['#e6f1fb', '#c5dff5', '#94c8eb', '#6baed6', '#378add', '#1a5bd6', '#0c447c'],
  getMetric: (state) => state?.population?.['2023'] ?? 0,
  formatMetric: (val) => val.toLocaleString(),
  metricLabel: 'Population',
  StatePanel,
}
