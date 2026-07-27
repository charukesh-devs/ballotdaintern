import PopulationGrowthChart from './PopulationGrowthChart'
import MigrationFlow from './MigrationFlow'

const RACE_COLORS = {
  white: '#1a5bd6',
  black: '#d64545',
  hispanic: '#f5b02e',
  asian: '#0f9d6c',
  aian: '#8e44ad',
  two_plus: '#378add',
  other: '#555550',
}

const RACE_LABELS = {
  white: 'White',
  black: 'Black',
  hispanic: 'Hispanic',
  asian: 'Asian',
  aian: 'Native American',
  two_plus: 'Two+ Races',
  other: 'Other',
}

export default function StatePanel({ state, onClose }) {
  const pop = state.population['2023']
  const growth = state.growth_pct

  const ageGroups = [
    { label: 'Under 18', value: state.age.under_18 },
    { label: '18–24', value: state.age['18_to_24'] },
    { label: '25–44', value: state.age['25_to_44'] },
    { label: '45–64', value: state.age['45_to_64'] },
    { label: '65+', value: state.age['65_plus'] },
  ]
  const maxAge = Math.max(...ageGroups.map(a => a.value))

  const raceGroups = [
    { key: 'white', value: state.race.white },
    { key: 'black', value: state.race.black },
    { key: 'hispanic', value: state.race.hispanic },
    { key: 'asian', value: state.race.asian },
    { key: 'aian', value: state.race.aian },
    { key: 'two_plus', value: state.race.two_plus },
    { key: 'other', value: state.race.other },
  ].filter(r => r.value > 0)

  return (
    <div className="state-panel">
      <div className="state-panel-header">
        <div className="state-panel-title">
          <h2>{state.name}</h2>
          <span className="state-panel-abbr">{state.abbr}</span>
        </div>
        <div className="state-panel-actions">
          <span className="rank-badge">#{state.population_rank}</span>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
      </div>

      <div className="state-panel-body">
        <div className="state-hero">
          <div className="state-hero-pop">{pop.toLocaleString()}</div>
          <div className="state-hero-label">Population (2023)</div>
          <div className={`growth-badge ${growth >= 0 ? 'positive' : 'negative'}`}>
            {growth >= 0 ? '↑' : '↓'} {Math.abs(growth)}% since 2020
          </div>
        </div>

        <div className="state-quick-stats">
          <div className="quick-stat gold-accent">
            <div className="quick-stat-value">#{state.population_rank}</div>
            <div className="quick-stat-label">National Rank</div>
          </div>
          <div className="quick-stat">
            <div className="quick-stat-value">${state.income.toLocaleString()}</div>
            <div className="quick-stat-label">Median Income</div>
          </div>
          <div className="quick-stat">
            <div className="quick-stat-value">{state.births_2023.toLocaleString()}</div>
            <div className="quick-stat-label">Births (2023)</div>
          </div>
        </div>

        <div className="panel-section-title">Population Growth</div>
        <PopulationGrowthChart population={state.population} name={state.name} />

        <div className="panel-section-title">Migration (2023)</div>
        <MigrationFlow state={state} />

        <div className="panel-section-title">Age Distribution</div>
        <div className="panel-bars">
          {ageGroups.map(ag => (
            <div className="panel-bar-row" key={ag.label}>
              <span className="panel-bar-label">{ag.label}</span>
              <div className="panel-bar-track">
                <div
                  className="panel-bar-fill"
                  style={{ width: `${(ag.value / maxAge) * 100}%` }}
                />
              </div>
              <span className="panel-bar-value">
                {((ag.value / state.age.total) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>

        <div className="panel-section-title">Race & Ethnicity</div>
        <div className="race-list">
          {raceGroups.map(r => (
            <div className="race-row" key={r.key}>
              <span className="race-dot" style={{ background: RACE_COLORS[r.key] }} />
              <span className="race-name">{RACE_LABELS[r.key]}</span>
              <span className="race-pct">
                {((r.value / state.race.total) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>

        <div className="panel-source">
          Data: U.S. Census Bureau — PEP 2020–2023 &amp; ACS 1-Year 2023
        </div>
      </div>
    </div>
  )
}
