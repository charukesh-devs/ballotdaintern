/**
 * Generic national/summary stat-card row shown above the map. Each module
 * supplies its own `summary(states)` function (see modules/registry.js)
 * that returns an array of { label, value, sub } — this component just
 * renders whatever it's given.
 */
export default function SummaryCards({ cards }) {
  if (!cards || !cards.length) return null

  return (
    <div className="stat-cards">
      {cards.map(c => (
        <div className="stat-card" key={c.label}>
          <div className="stat-card-label">{c.label}</div>
          <div className="stat-card-value">{c.value}</div>
          {c.sub && <div className="stat-card-sub">{c.sub}</div>}
        </div>
      ))}
    </div>
  )
}
