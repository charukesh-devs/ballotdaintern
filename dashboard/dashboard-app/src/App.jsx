import { useState, useEffect, useMemo } from 'react'
import USMap from './components/USMap'
import StatePanel from './components/StatePanel'
import ModuleTabs from './components/ModuleTabs'
import SummaryCards from './components/SummaryCards'
import StateRanking from './components/StateRanking'
import TrendChart from './components/TrendChart'
import modules from './modules/registry'
import './App.css'

const VIEW_LABELS = { map: 'Map', ranking: 'Ranking', trend: 'Trend' }

function App() {
  const [activeModuleId, setActiveModuleId] = useState(modules[0].id)
  const [dataByModule, setDataByModule] = useState({})
  const [selectedState, setSelectedState] = useState(null)
  const [tooltip, setTooltip] = useState(null)
  const [view, setView] = useState('map')

  const activeModule = modules.find(m => m.id === activeModuleId)
  const data = dataByModule[activeModuleId]

  // Fetch each module's data lazily, the first time its tab is opened.
  useEffect(() => {
    if (dataByModule[activeModuleId]) return
    fetch(activeModule.dataUrl)
      .then(r => r.json())
      .then(json => setDataByModule(prev => ({ ...prev, [activeModuleId]: json })))
  }, [activeModuleId, activeModule, dataByModule])

  const availableViews = activeModule.views && activeModule.views.length ? activeModule.views : ['map']

  function handleModuleSelect(id) {
    setActiveModuleId(id)
    setSelectedState(null)
    setTooltip(null)
    setView('map')
  }

  const summaryCards = useMemo(() => {
    if (!data || !activeModule.summary) return null
    return activeModule.summary(data.states)
  }, [data, activeModule])

  const stateList = useMemo(() => {
    if (!data) return []
    return Object.values(data.states)
  }, [data])

  if (!data) return (
    <div className="loading">
      <div className="loading-spinner" />
      <span>Loading {activeModule.label.toLowerCase()} data...</span>
    </div>
  )

  const states = data.states

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="header-badge">AMERICA250</div>
          <h1>{activeModule.title}</h1>
          <p className="header-sub">{activeModule.subtitle}</p>
        </div>
      </header>

      <ModuleTabs modules={modules} activeId={activeModuleId} onSelect={handleModuleSelect} />

      {summaryCards && <SummaryCards cards={summaryCards} />}

      {availableViews.length > 1 && (
        <div className="view-tabs">
          {availableViews.map(v => (
            <button
              key={v}
              className={`view-tab ${view === v ? 'active' : ''}`}
              onClick={() => setView(v)}
            >
              {VIEW_LABELS[v] || v}
            </button>
          ))}
        </div>
      )}

      {view === 'map' && (
        <div className="main-layout">
          <div className={`map-section ${selectedState ? 'shifted' : ''}`}>
            <USMap
              states={states}
              metric={activeModule.mapMetric}
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
                module={activeModule}
                onClose={() => setSelectedState(null)}
              />
            ) : (
              <div className="panel-placeholder">
                <div className="placeholder-icon">🗺️</div>
                <h3>Select a State</h3>
                <p>Click any state on the map to view its {activeModule.label.toLowerCase()} breakdown</p>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'ranking' && activeModule.ranking && (
        <StateRanking
          stateList={stateList}
          columns={activeModule.ranking.columns}
          onSelect={fips => { setSelectedState(fips); setView('map') }}
        />
      )}

      {view === 'trend' && activeModule.trend && (
        <TrendChart
          stateList={stateList}
          periods={activeModule.trend.periods}
          getSeriesValue={activeModule.trend.getSeriesValue}
          rankBy={activeModule.trend.rankBy}
          title={activeModule.trend.title}
          axisFormat={activeModule.trend.axisFormat}
        />
      )}

      <footer className="footer">
        <div className="footer-badge">AMERICA250</div>
        <p>{activeModule.source}</p>
      </footer>
    </div>
  )
}

export default App
