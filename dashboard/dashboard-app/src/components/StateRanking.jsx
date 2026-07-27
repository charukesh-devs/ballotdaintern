import { useState } from 'react'

const COLUMNS = [
  { key: 'population_rank', label: '#', format: v => v },
  { key: 'name', label: 'State', format: (v, s) => <><span className="abbr-badge">{s.abbr}</span>{v}</> },
  { key: 'population', label: 'Population', format: (v) => v['2023'].toLocaleString(), sort: (s) => s.population['2023'] },
  { key: 'growth_pct', label: 'Growth', format: (v) => `${v >= 0 ? '+' : ''}${v}%`, sort: (s) => s.growth_pct },
  { key: 'income', label: 'Median Income', format: (v) => `$${v.toLocaleString()}` },
  { key: 'under_18', label: 'Under 18', format: (v, s) => `${((v / s.age.total) * 100).toFixed(1)}%`, sort: (s) => s.age.under_18 / s.age.total },
  { key: '65_plus', label: '65+', format: (v, s) => `${((v / s.age.total) * 100).toFixed(1)}%`, sort: (s) => s.age['65_plus'] / s.age.total },
]

export default function StateRanking({ stateList, onSelect }) {
  const [sortCol, setSortCol] = useState('population')
  const [sortDir, setSortDir] = useState('desc')

  const sorted = [...stateList].sort((a, b) => {
    const col = COLUMNS.find(c => c.key === sortCol)
    const va = col?.sort ? col.sort(a) : a[sortCol]
    const vb = col?.sort ? col.sort(b) : b[sortCol]
    if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    return sortDir === 'asc' ? va - vb : vb - va
  })

  function handleSort(key) {
    if (key === sortCol) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(key)
      setSortDir('desc')
    }
  }

  return (
    <div className="ranking-section">
      <div className="ranking-card">
        <h3>All States — Sorted by {COLUMNS.find(c => c.key === sortCol)?.label}</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="ranking-table">
            <thead>
              <tr>
                {COLUMNS.map(col => (
                  <th
                    key={col.key}
                    className={sortCol === col.key ? 'sorted' : ''}
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => (
                <tr key={s.fips} onClick={() => onSelect(s.fips)}>
                  {COLUMNS.map(col => (
                    <td key={col.key} className={col.key === 'name' ? 'state-col' : ''}>
                      {col.format(s[col.key], s)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
