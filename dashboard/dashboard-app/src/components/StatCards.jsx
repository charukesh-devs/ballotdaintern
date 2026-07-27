function formatNum(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  return n.toString()
}

export default function StatCards({ totalPop, stateCount, avgGrowth, avgIncome, year }) {
  return (
    <div className="stat-cards">
      <div className="stat-card">
        <div className="stat-card-label">Total Population ({year})</div>
        <div className="stat-card-value">{formatNum(totalPop)}</div>
        <div className="stat-card-sub">Across 50 states + DC</div>
      </div>
      <div className="stat-card">
        <div className="stat-card-label">States & Territories</div>
        <div className="stat-card-value">{stateCount}</div>
        <div className="stat-card-sub">Including D.C.</div>
      </div>
      <div className="stat-card">
        <div className="stat-card-label">Avg. Growth (2020–23)</div>
        <div className="stat-card-value">{avgGrowth}%</div>
        <div className="stat-card-sub">National average</div>
      </div>
      <div className="stat-card">
        <div className="stat-card-label">Avg. Median Income</div>
        <div className="stat-card-value">${formatNum(avgIncome)}</div>
        <div className="stat-card-sub">Household, ACS 2023</div>
      </div>
    </div>
  )
}
