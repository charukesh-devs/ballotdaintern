import { useState, useEffect } from 'react'
import USMap from './components/USMap'
import StatePanel from './components/StatePanel'
import './App.css'

function App() {
  const [data, setData] = useState(null)
  const [selectedState, setSelectedState] = useState(null)
  const [tooltip, setTooltip] = useState(null)

  useEffect(() => {
    fetch('/demographics.json')
      .then(r => r.json())
      .then(setData)
  }, [])

  if (!data) return (
    <div className="loading">
      <div className="loading-spinner" />
      <span>Loading demographics data...</span>
    </div>
  )

  const states = data.states

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="header-badge">AMERICA250</div>
          <h1>U.S. Census Demographics</h1>
          <p className="header-sub">Click any state to view its demographics breakdown</p>
        </div>
      </header>

      <div className="main-layout">
        <div className={`map-section ${selectedState ? 'shifted' : ''}`}>
          <USMap
            states={states}
            selectedState={selectedState}
            onSelect={setSelectedState}
            tooltip={tooltip}
            setTooltip={setTooltip}
          />
        </div>
        <div className={`panel-section ${selectedState ? 'open' : ''}`}>
          {selectedState && states[selectedState] ? (
            <StatePanel
              state={states[selectedState]}
              onClose={() => setSelectedState(null)}
            />
          ) : (
            <div className="panel-placeholder">
              <div className="placeholder-icon">🗺️</div>
              <h3>Select a State</h3>
              <p>Click any state on the map to view its demographics breakdown</p>
            </div>
          )}
        </div>
      </div>

      <footer className="footer">
        <div className="footer-badge">AMERICA250</div>
        <p>Data: U.S. Census Bureau — PEP 2020–2023 &amp; ACS 1-Year 2023</p>
      </footer>
    </div>
  )
}

export default App
