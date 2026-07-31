/**
 * Generic colored-dot category list (originally the "Race & Ethnicity" list).
 * Works for any set of named categories that add up to a total — sector
 * shares of employment, housing tenure types, language groups, etc.
 *
 * props:
 *   groups: [{ key: string, label: string, value: number, color: string }]
 *   total: number
 */
export default function CategoryBreakdown({ groups, total }) {
  return (
    <div className="race-list">
      {groups.filter(g => g.value > 0).map(g => (
        <div className="race-row" key={g.key}>
          <span className="race-dot" style={{ background: g.color }} />
          <span className="race-name">{g.label}</span>
          <span className="race-pct">
            {total ? ((g.value / total) * 100).toFixed(1) : '0.0'}%
          </span>
        </div>
      ))}
    </div>
  )
}
