import TimeSeriesChart from './TimeSeriesChart'
import FlowCompare from './FlowCompare'
import BarBreakdown from './BarBreakdown'
import CategoryBreakdown from './CategoryBreakdown'

/**
 * Generic detail panel shown when a state is selected. It doesn't know
 * anything about demographics, economics, or any other domain — it just
 * walks the active module's `panel` config (see modules/registry.js) and
 * renders each piece with the matching generic component.
 *
 * This is the file a module author never needs to touch: describe your
 * panel in the module config, and this renders it.
 */
export default function StatePanel({ state, module, onClose }) {
  const panel = module.panel
  const hero = panel.hero
  const badge = panel.badge

  return (
    <div className="state-panel">
      <div className="state-panel-header">
        <div className="state-panel-title">
          <h2>{state.name}</h2>
          <span className="state-panel-abbr">{state.abbr}</span>
        </div>
        <div className="state-panel-actions">
          {panel.rankBadge && <span className="rank-badge">#{panel.rankBadge.getValue(state)}</span>}
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
      </div>

      <div className="state-panel-body">
        {hero && (
          <div className="state-hero">
            <div className="state-hero-pop">{hero.format ? hero.format(hero.getValue(state)) : hero.getValue(state)}</div>
            <div className="state-hero-label">{hero.label}</div>
            {badge && (() => {
              const v = badge.getValue(state)
              const positive = v >= 0
              return (
                <div className={`growth-badge ${positive ? 'positive' : 'negative'}`}>
                  {positive ? '↑' : '↓'} {Math.abs(v)}{badge.suffix ? ` ${badge.suffix}` : ''}
                </div>
              )
            })()}
          </div>
        )}

        {panel.quickStats && (
          <div className="state-quick-stats">
            {panel.quickStats.map(qs => (
              <div className={`quick-stat ${qs.accent ? qs.accent + '-accent' : ''}`} key={qs.label}>
                <div className="quick-stat-value">{qs.format ? qs.format(qs.getValue(state)) : qs.getValue(state)}</div>
                <div className="quick-stat-label">{qs.label}</div>
              </div>
            ))}
          </div>
        )}

        {panel.sections?.map(section => (
          <div key={section.title}>
            <div className="panel-section-title">{section.title}</div>
            {section.type === 'timeseries' && (
              <TimeSeriesChart
                series={section.getSeries(state)}
                name={state.abbr}
                color={section.color}
                valueFormat={section.valueFormat}
                axisFormat={section.axisFormat}
              />
            )}
            {section.type === 'flow' && (
              <FlowCompare
                rows={section.getRows(state)}
                netLabel={section.netLabel}
                format={section.format}
              />
            )}
            {section.type === 'bars' && (
              <BarBreakdown
                groups={section.getGroups(state)}
                total={section.getTotal(state)}
              />
            )}
            {section.type === 'categories' && (
              <CategoryBreakdown
                groups={section.getGroups(state)}
                total={section.getTotal(state)}
              />
            )}
          </div>
        ))}

        <div className="panel-source">{module.source}</div>
      </div>
    </div>
  )
}
