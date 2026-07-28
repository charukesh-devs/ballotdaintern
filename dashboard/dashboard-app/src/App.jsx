import { useState, useEffect } from 'react'
import USMap from './components/USMap'
import { modules, defaultModule } from './modules/registry'
import './App.css'

function App() {
  const [data, setData] = useState(null)
  const [selectedState, setSelectedState] = useState(null)
  const [tooltip, setTooltip] = useState(null)
  const [currentModuleId, setCurrentModuleId] = useState(defaultModule)

  useEffect(() => {
    fetch('/demographics.json')
      .then(r => r.json())
      .then(setData)
  }, [])

  if (!data) return (
    <div className="loading">
      <div className="loading-spinner" />
      <span>Loading data...</span>
    </div>
  )

  const states = data.states
  const currentModule = modules.find(m => m.id === currentModuleId) || modules[0]

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="header-badge">AMERICA250</div>
          <h1>U.S. Data Dashboard</h1>
          <p className="header-sub">Click any state to view its breakdown</p>
        </div>
      </header>

      <nav className="module-tabs">
        {modules.map(m => (
          <button
            key={m.id}
            className={`module-tab ${currentModule.id === m.id ? 'active' : ''}`}
            onClick={() => { setCurrentModuleId(m.id); setSelectedState(null) }}
          >
            <span className="module-tab-icon">{m.icon}</span>
            <span className="module-tab-name">{m.name}</span>
          </button>
        ))}
      </nav>

      <div className="main-layout">
        <div className={`map-section ${selectedState ? 'shifted' : ''}`}>
          <USMap
            states={states}
            selectedState={selectedState}
            onSelect={setSelectedState}
            tooltip={tooltip}
            setTooltip={setTooltip}
            getMetric={currentModule.getMetric}
            colorRange={currentModule.colorScale}
            metricLabel={currentModule.metricLabel}
          />
        </div>
        <div className={`panel-section ${selectedState ? 'open' : ''}`}>
          {selectedState && states[selectedState] ? (
            <currentModule.StatePanel
              state={states[selectedState]}
              onClose={() => setSelectedState(null)}
            />
          ) : (
            <div className="panel-placeholder">
              <div className="placeholder-icon">{'\u{1F5FA}\uFE0F'}</div>
              <h3>Select a State</h3>
              <p>Click any state on the map to view its {currentModule.description.toLowerCase()}</p>
            </div>
          )}
        </div>
      </div>

      <footer className="footer">
        <div className="footer-badge">AMERICA250</div>
        <p>Data: U.S. Census Bureau &mdash; PEP 2020&ndash;2023 &amp; ACS 1-Year 2023</p>
      </footer>
    </div>
  )
}

export default App
