/**
 * Generic "signed value bars + net total" component. Originally built for
 * domestic/international migration, but works for anything that's a set of
 * positive/negative flows that sum to a net figure (e.g. exports vs.
 * imports, revenue vs. expenses, jobs gained vs. lost).
 *
 * props:
 *   rows: [{ label: string, value: number }]
 *   netLabel: string (default 'Net')
 *   format: (v) => string
 */
export default function FlowCompare({ rows, netLabel = 'Net', format }) {
  const fmt = format || (v => v.toLocaleString())
  const net = rows.reduce((sum, r) => sum + r.value, 0)
  const maxVal = Math.max(...rows.map(r => Math.abs(r.value)), 1)

  return (
    <div className="migration-flow">
      {rows.map(r => (
        <div className="migration-row" key={r.label}>
          <span className="migration-label">{r.label}</span>
          <div className="migration-bar-track">
            <div
              className={`migration-bar-fill ${r.value >= 0 ? 'positive' : 'negative'}`}
              style={{ width: `${(Math.abs(r.value) / maxVal) * 100}%` }}
            />
          </div>
          <span className={`migration-value ${r.value >= 0 ? 'positive' : 'negative'}`}>
            {r.value >= 0 ? '+' : ''}{fmt(r.value)}
          </span>
        </div>
      ))}
      <div className="migration-net">
        <span>{netLabel}</span>
        <span className={`migration-net-value ${net >= 0 ? 'positive' : 'negative'}`}>
          {net >= 0 ? '+' : ''}{fmt(net)}
        </span>
      </div>
    </div>
  )
}
