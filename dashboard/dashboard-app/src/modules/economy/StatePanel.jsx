export default function StatePanel({ state, onClose }) {
  return (
    <div className="state-panel">
      <div className="state-panel-header">
        <div className="state-panel-title">
          <h2>{state.name}</h2>
          <span className="state-panel-abbr">{state.abbr}</span>
        </div>
        <div className="state-panel-actions">
          <button className="close-btn" onClick={onClose}>\u00d7</button>
        </div>
      </div>
      <div className="state-panel-body">
        <div className="state-hero">
          <div className="state-hero-pop">${(state.income || 0).toLocaleString()}</div>
          <div className="state-hero-label">Median Household Income (2023)</div>
        </div>

        <div className="state-quick-stats">
          <div className="quick-stat gold-accent">
            <div className="quick-stat-value">${(state.income || 0).toLocaleString()}</div>
            <div className="quick-stat-label">Median Income</div>
          </div>
          <div className="quick-stat">
            <div className="quick-stat-value">{state.births_2023?.toLocaleString() || '\u2014'}</div>
            <div className="quick-stat-label">Births (2023)</div>
          </div>
          <div className="quick-stat">
            <div className="quick-stat-value">{state.deaths_2023?.toLocaleString() || '\u2014'}</div>
            <div className="quick-stat-label">Deaths (2023)</div>
          </div>
        </div>

        <div className="panel-section-title">Economy Overview</div>
        <div style={{ color: '#999', fontSize: '0.82rem', textAlign: 'center', padding: '2rem 1rem', lineHeight: 1.6 }}>
          Add economy data to populate this section.
          <br />
          Create <code>economy.json</code> in <code>public/</code> and update
          <br />
          <code>src/modules/economy/StatePanel.jsx</code>
        </div>

        <div className="panel-source">
          Data: Bureau of Economic Analysis &amp; Bureau of Labor Statistics
        </div>
      </div>
    </div>
  )
}
