export default function MigrationFlow({ state }) {
  const domestic = state.domestic_migration_2023
  const intl = state.intl_migration_2023
  const net = domestic + intl
  const maxVal = Math.max(Math.abs(domestic), intl, 1)

  return (
    <div className="migration-flow">
      <div className="migration-row">
        <span className="migration-label">Domestic</span>
        <div className="migration-bar-track">
          <div
            className={`migration-bar-fill ${domestic >= 0 ? 'positive' : 'negative'}`}
            style={{ width: `${(Math.abs(domestic) / maxVal) * 100}%` }}
          />
        </div>
        <span className={`migration-value ${domestic >= 0 ? 'positive' : 'negative'}`}>
          {domestic >= 0 ? '+' : ''}{domestic.toLocaleString()}
        </span>
      </div>
      <div className="migration-row">
        <span className="migration-label">International</span>
        <div className="migration-bar-track">
          <div
            className="migration-bar-fill positive"
            style={{ width: `${(intl / maxVal) * 100}%` }}
          />
        </div>
        <span className="migration-value positive">
          +{intl.toLocaleString()}
        </span>
      </div>
      <div className="migration-net">
        <span>Net Migration</span>
        <span className={`migration-net-value ${net >= 0 ? 'positive' : 'negative'}`}>
          {net >= 0 ? '+' : ''}{net.toLocaleString()}
        </span>
      </div>
    </div>
  )
}
