const pct = v => `${v.toFixed(1)}%`
const comma = v => v.toLocaleString()
const inches = v => `${v.toFixed(1)} in`
const feet = v => `${v.toLocaleString()} ft`
const fahr = v => `${v.toFixed(1)}°F`

const REGION_COLORS = {
  Northeast: '#e74c3c',
  South: '#f39c12',
  Midwest: '#2ecc71',
  West: '#3498db',
}

export default {
  id: 'geography',
  label: 'Geography',
  icon: '🏔️',
  owner: 'Charu',

  dataUrl: '/geography.json',

  title: 'U.S. Geography & Environment',
  subtitle: 'Click any state to explore its geography, climate, and environment',
  source: 'Data: EPA, USGS, NOAA, NPS, USDA Forest Service',

  mapMetric: {
    getValue: state => state.mean_elev_ft,
    format: v => `${v.toLocaleString()} ft`,
    label: 'Mean Elevation',
    colors: ['#fef0d9', '#fdd49e', '#fdbb84', '#fc8d59', '#ef6548', '#d7301f', '#990000', '#4d0000'],
  },

  summary(states) {
    const list = Object.values(states)
    const avgElev = Math.round(list.reduce((s, x) => s + x.mean_elev_ft, 0) / list.length)
    const avgTemp = (list.reduce((s, x) => s + x.avg_temp_f, 0) / list.length).toFixed(1)
    const avgGoodAir = (list.reduce((s, x) => s + x.good_air_days_pct, 0) / list.length).toFixed(1)
    const totalParks = list.reduce((s, x) => s + x.national_parks_count, 0)
    const totalForest = list.reduce((s, x) => s + x.forest_cover_pct, 0) / list.length
    return [
      { label: 'Avg. Elevation', value: `${avgElev.toLocaleString()} ft`, sub: 'Mean across all states' },
      { label: 'Avg. Temperature', value: `${avgTemp}°F`, sub: 'Annual average' },
      { label: 'Avg. Good Air Days', value: `${avgGoodAir}%`, sub: '2020–2024 average' },
      { label: 'National Parks Total', value: String(totalParks), sub: `Avg ${totalForest.toFixed(0)}% forest cover` },
    ]
  },

  panel: {
    hero: {
      getValue: state => state.mean_elev_ft,
      format: v => `${v.toLocaleString()} ft`,
      label: 'Mean Elevation',
    },
    badge: {
      getValue: state => state.highest_elev_ft,
      suffix: 'ft highest point',
    },
    rankBadge: { getValue: state => state.elev_range_ft > 0 ? Math.round(state.elev_range_ft).toLocaleString() : 0 },
    quickStats: [
      {
        label: 'Region',
        getValue: state => state.region,
        format: v => v || '—',
        accent: 'gold',
      },
      {
        label: 'Area',
        getValue: state => state.total_area_sqmi,
        format: v => `${v.toLocaleString()} sq mi`,
      },
      {
        label: 'Pop. Density',
        getValue: state => state.pop_density,
        format: v => `${v.toFixed(1)}/sq mi`,
      },
    ],
    sections: [
      {
        title: 'Climate',
        type: 'categories',
        getGroups: state => [
          { key: 'avg_temp', label: 'Avg Annual Temp', value: Math.max(state.avg_temp_f, 0), color: '#e74c3c' },
          { key: 'summer_temp', label: 'Summer Temp', value: Math.max(state.avg_summer_temp_f, 0), color: '#e67e22' },
          { key: 'winter_temp', label: 'Winter Temp', value: Math.max(state.avg_winter_temp_f, 0), color: '#3498db' },
          { key: 'precip', label: 'Precipitation', value: Math.max(state.avg_precip_in, 0), color: '#2ecc71' },
          { key: 'snowfall', label: 'Snowfall', value: Math.max(state.avg_snowfall_in, 0), color: '#ecf0f1' },
        ],
        getTotal: state => {
          const t = Math.max(state.avg_temp_f, 0) + Math.max(state.avg_summer_temp_f, 0) + Math.max(state.avg_winter_temp_f, 0) + Math.max(state.avg_precip_in, 0) + Math.max(state.avg_snowfall_in, 0)
          return t || 1
        },
      },
      {
        title: 'Air Quality (2020–2024)',
        type: 'bars',
        getGroups: state => [
          { label: 'Good Air Days', value: state.good_air_days_pct },
          { label: 'Median AQI', value: state.median_aqi },
          { label: 'Unhealthy Days', value: state.unhealthy_days },
        ],
        getTotal: state => 100,
      },
      {
        title: 'Elevation Profile',
        type: 'bars',
        getGroups: state => [
          { label: 'Highest Point', value: state.highest_elev_ft },
          { label: 'Mean Elevation', value: state.mean_elev_ft },
          { label: 'Elevation Range', value: state.elev_range_ft },
        ],
        getTotal: state => state.highest_elev_ft || 1,
      },
      {
        title: 'Land Cover & Parks',
        type: 'flow',
        getRows: state => [
          { label: 'Forest Cover', value: state.forest_cover_pct },
          { label: 'National Parks', value: state.national_parks_count },
        ],
        netLabel: 'Forest / Parks',
      },
    ],
  },

  views: ['map', 'ranking', 'trend'],

  ranking: {
    columns: [
      { key: 'rank', label: '#', getValue: s => s.mean_elev_ft, sortValue: s => s.mean_elev_ft },
      { key: 'name', label: 'State', getValue: s => s.name, format: (v, s) => `${s.abbr} — ${v}` },
      { key: 'elevation', label: 'Mean Elevation', getValue: s => s.mean_elev_ft, format: v => `${v.toLocaleString()} ft` },
      { key: 'temp', label: 'Avg Temp', getValue: s => s.avg_temp_f, format: v => `${v.toFixed(1)}°F` },
      { key: 'forest', label: 'Forest Cover', getValue: s => s.forest_cover_pct, format: pct },
      { key: 'parks', label: 'National Parks', getValue: s => s.national_parks_count, format: v => String(v) },
      { key: 'air', label: 'Good Air Days', getValue: s => s.good_air_days_pct, format: pct },
      { key: 'density', label: 'Pop Density', getValue: s => s.pop_density, format: v => `${v.toFixed(1)}/sq mi` },
    ],
  },

  trend: {
    title: 'Elevation Profile — Top 10 States',
    periods: ['mean_elev_ft', 'highest_elev_ft', 'elev_range_ft'],
    getSeriesValue: (state, period) => {
      const v = state[period]
      return typeof v === 'number' ? v : 0
    },
    rankBy: state => state.mean_elev_ft,
    axisFormat: v => `${(v / 1000).toFixed(0)}K ft`,
  },
}
