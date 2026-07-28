import { useRef, useEffect } from 'react'
import * as d3 from 'd3'

/**
 * Generic multi-line trend chart comparing the top N states on any
 * metric across any set of periods. Which metric, how many states, and
 * which periods are all supplied by the module config.
 *
 * props:
 *   stateList: array of state records (each needs .fips and .abbr)
 *   periods: string[]                     e.g. ['2020','2021','2022','2023']
 *   getSeriesValue: (state, period) => number
 *   rankBy: (state) => number             used to pick the top N states
 *   topN: number                          default 10
 *   title: string
 *   axisFormat: (v) => string
 */
export default function TrendChart({ stateList, periods, getSeriesValue, rankBy, topN = 10, title, axisFormat }) {
  const svgRef = useRef(null)

  useEffect(() => {
    if (!svgRef.current || !stateList?.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 120, bottom: 30, left: 60 }
    const width = 900
    const height = 280
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    svg.attr('viewBox', `0 0 ${width} ${height}`)

    const top = [...stateList].sort((a, b) => rankBy(b) - rankBy(a)).slice(0, topN)

    const topData = top.map(s => ({
      fips: s.fips,
      name: s.abbr,
      values: periods.map(p => ({ period: p, val: getSeriesValue(s, p) || 0 })),
    }))

    const x = d3.scalePoint().domain(periods).range([0, innerW])
    const allVals = topData.flatMap(d => d.values.map(v => v.val))
    const y = d3.scaleLinear().domain([d3.min(allVals) * 0.95, d3.max(allVals) * 1.02]).range([innerH, 0])
    const fmtAxis = axisFormat || (d => d.toLocaleString())

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    g.selectAll('line.grid')
      .data(y.ticks(5))
      .join('line')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', d => y(d)).attr('y2', d => y(d))
      .attr('stroke', '#eee')

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickSize(0))
      .select('.domain').remove()

    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(fmtAxis).tickSize(0))
      .select('.domain').remove()

    const colors = d3.schemeTableau10
    const line = d3.line().x(d => x(d.period)).y(d => y(d.val)).curve(d3.curveMonotoneX)

    topData.forEach((d, i) => {
      g.append('path')
        .datum(d.values)
        .attr('fill', 'none')
        .attr('stroke', colors[i % colors.length])
        .attr('stroke-width', 2.5)
        .attr('d', line)

      const last = d.values[d.values.length - 1]
      g.append('text')
        .attr('x', innerW + 8)
        .attr('y', y(last.val))
        .attr('dy', '0.35em')
        .attr('fill', colors[i % colors.length])
        .attr('font-size', '10px')
        .attr('font-weight', '600')
        .text(d.name)

      g.append('circle')
        .attr('cx', x(d.values[0].period))
        .attr('cy', y(d.values[0].val))
        .attr('r', 3)
        .attr('fill', colors[i % colors.length])
    })

  }, [stateList, periods, getSeriesValue, rankBy, topN, axisFormat])

  return (
    <div className="trend-section">
      <div className="trend-card">
        <h3>{title}</h3>
        <svg ref={svgRef} style={{ width: '100%', height: 'auto' }} />
      </div>
    </div>
  )
}
