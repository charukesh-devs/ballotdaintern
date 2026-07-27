import { useRef, useEffect } from 'react'
import * as d3 from 'd3'

const TOP_STATES = ['06', '48', '12', '36', '42', '17', '39', '13', '37', '26']

export default function TrendChart({ stateList, states }) {
  const svgRef = useRef(null)

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 120, bottom: 30, left: 60 }
    const width = 900
    const height = 280
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    svg.attr('viewBox', `0 0 ${width} ${height}`)

    const years = ['2020', '2021', '2022', '2023']

    const topData = TOP_STATES.map(fips => ({
      fips,
      name: states[fips]?.abbr || fips,
      values: years.map(y => ({ year: y, pop: states[fips]?.population[y] || 0 })),
    }))

    const x = d3.scalePoint().domain(years).range([0, innerW])
    const allPops = topData.flatMap(d => d.values.map(v => v.pop))
    const y = d3.scaleLinear().domain([d3.min(allPops) * 0.95, d3.max(allPops) * 1.02]).range([innerH, 0])

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    // Grid
    g.selectAll('line.grid')
      .data(y.ticks(5))
      .join('line')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', d => y(d)).attr('y2', d => y(d))
      .attr('stroke', '#eee')

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickSize(0))
      .select('.domain').remove()

    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => (d / 1_000_000).toFixed(0) + 'M').tickSize(0))
      .select('.domain').remove()

    // Lines
    const colors = d3.schemeTableau10
    const line = d3.line().x(d => x(d.year)).y(d => y(d.pop)).curve(d3.curveMonotoneX)

    topData.forEach((d, i) => {
      g.append('path')
        .datum(d.values)
        .attr('fill', 'none')
        .attr('stroke', colors[i])
        .attr('stroke-width', 2.5)
        .attr('d', line)

      // End label
      const last = d.values[d.values.length - 1]
      g.append('text')
        .attr('x', innerW + 8)
        .attr('y', y(last.pop))
        .attr('dy', '0.35em')
        .attr('fill', colors[i])
        .attr('font-size', '10px')
        .attr('font-weight', '600')
        .text(d.name)

      // Start dot
      g.append('circle')
        .attr('cx', x(d.values[0].year))
        .attr('cy', y(d.values[0].pop))
        .attr('r', 3)
        .attr('fill', colors[i])
    })

  }, [stateList, states])

  return (
    <div className="trend-section">
      <div className="trend-card">
        <h3>Population Trend — Top 10 States (2020–2023)</h3>
        <svg ref={svgRef} style={{ width: '100%', height: 'auto' }} />
      </div>
    </div>
  )
}
