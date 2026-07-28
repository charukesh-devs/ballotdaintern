import { useState } from 'react'

/**
 * Generic sortable "all states" table. Each module supplies its own
 * `columns` (see modules/registry.js) so this file never needs to know
 * about population, income, or any other domain-specific field.
 *
 * columns: [{
 *   key: string,                       // unique column key
 *   label: string,                     // header text
 *   getValue: (state) => any,          // raw value for display
 *   format: (value, state) => node,    // how to render it (optional, defaults to String(value))
 *   sortValue: (state) => number|string, // value used for sorting (optional, defaults to getValue)
 * }]
 */
export default function StateRanking({ stateList, columns, onSelect, title }) {
  const [sortCol, setSortCol] = useState(columns[0]?.key)
  const [sortDir, setSortDir] = useState('desc')

  const activeCol = columns.find(c => c.key === sortCol) || columns[0]

  const sorted = [...stateList].sort((a, b) => {
    const va = activeCol.sortValue ? activeCol.sortValue(a) : activeCol.getValue(a)
    const vb = activeCol.sortValue ? activeCol.sortValue(b) : activeCol.getValue(b)
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
        <h3>{title || `All States — Sorted by ${activeCol.label}`}</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="ranking-table">
            <thead>
              <tr>
                {columns.map(col => (
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
                  {columns.map(col => {
                    const v = col.getValue(s)
                    return (
                      <td key={col.key} className={col.key === 'name' ? 'state-col' : ''}>
                        {col.format ? col.format(v, s) : String(v)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
