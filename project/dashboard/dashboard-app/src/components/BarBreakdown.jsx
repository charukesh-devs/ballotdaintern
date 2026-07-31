/**
 * Generic horizontal-bar breakdown (originally the "Age Distribution" bars).
 * Any module can use this for any group-of-values-as-share-of-total display.
 *
 * props:
 *   groups: [{ label: string, value: number }]
 *   total: number   denominator used for the percentage shown on the right
 */
export default function BarBreakdown({ groups, total }) {
  const maxVal = Math.max(...groups.map(g => g.value), 1)

  return (
    <div className="panel-bars">
      {groups.map(g => (
        <div className="panel-bar-row" key={g.label}>
          <span className="panel-bar-label">{g.label}</span>
          <div className="panel-bar-track">
            <div
              className="panel-bar-fill"
              style={{ width: `${(g.value / maxVal) * 100}%` }}
            />
          </div>
          <span className="panel-bar-value">
            {total ? ((g.value / total) * 100).toFixed(1) : '0.0'}%
          </span>
        </div>
      ))}
    </div>
  )
}
