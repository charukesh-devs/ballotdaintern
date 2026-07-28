import { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'

const SMALL_STATES = new Set(['09', '10', '11', '24', '25', '33', '34', '44', '50'])

export default function USMap({ states, selectedState, onSelect, tooltip, setTooltip, getMetric, colorRange, metricLabel }) {
  const svgRef = useRef(null)
  const [topoData, setTopoData] = useState(null)

  useEffect(() => {
    fetch('/us-states.json')
      .then(r => r.json())
      .then(setTopoData)
  }, [])

  useEffect(() => {
    if (!topoData || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = 960
    const height = 600
    svg.attr('viewBox', `0 0 ${width} ${height}`)

    const projection = d3.geoAlbersUsa().fitSize([width, height], topojson.feature(topoData, topoData.objects.nation))
    const path = d3.geoPath().projection(projection)

    const metrics = Object.values(states).map(s => getMetric(s)).filter(v => v > 0)
    const colorScale = d3.scaleQuantize()
      .domain([d3.min(metrics), d3.max(metrics)])
      .range(colorRange || ['#e6f1fb', '#0c447c'])

    const g = svg.append('g')
    const statesGeo = topojson.feature(topoData, topoData.objects.states)

    g.selectAll('path.state')
      .data(statesGeo.features)
      .join('path')
      .attr('class', 'state')
      .attr('d', path)
      .attr('fill', d => {
        const fips = String(d.id).padStart(2, '0')
        const s = states[fips]
        if (!s) return '#eee'
        const m = getMetric(s)
        return m > 0 ? colorScale(m) : '#eee'
      })
      .attr('stroke', d => {
        const fips = String(d.id).padStart(2, '0')
        return fips === selectedState ? '#f5b02e' : '#fff'
      })
      .attr('stroke-width', d => {
        const fips = String(d.id).padStart(2, '0')
        return fips === selectedState ? 3 : 1
      })
      .style('transition', 'fill 0.2s ease, stroke 0.2s ease, stroke-width 0.2s ease')
      .on('mouseenter', function (e, d) {
        const fips = String(d.id).padStart(2, '0')
        const s = states[fips]
        if (!s) return
        d3.select(this).raise().attr('stroke', fips === selectedState ? '#f5b02e' : '#071633').attr('stroke-width', 2.5)
        setTooltip({ x: e.clientX, y: e.clientY, name: s.name, value: getMetric(s) })
      })
      .on('mousemove', function (e) {
        setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)
      })
      .on('mouseleave', function (e, d) {
        setTooltip(null)
        const fips = String(d.id).padStart(2, '0')
        d3.select(this)
          .attr('stroke', fips === selectedState ? '#f5b02e' : '#fff')
          .attr('stroke-width', fips === selectedState ? 3 : 1)
      })
      .on('click', function (e, d) {
        const fips = String(d.id).padStart(2, '0')
        onSelect(fips === selectedState ? null : fips)
      })

    g.selectAll('text.state-label')
      .data(statesGeo.features)
      .join('text')
      .attr('class', 'state-label')
      .attr('x', d => path.centroid(d)[0])
      .attr('y', d => path.centroid(d)[1])
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', d => {
        const fips = String(d.id).padStart(2, '0')
        const s = states[fips]
        if (!s) return '#666'
        if (fips === selectedState) return '#fff'
        const m = getMetric(s)
        return m > 15_000_000 ? '#fff' : '#444'
      })
      .attr('font-size', d => {
        const fips = String(d.id).padStart(2, '0')
        return SMALL_STATES.has(fips) ? '7px' : '9.5px'
      })
      .attr('font-weight', '700')
      .attr('font-family', "'Lexend', sans-serif")
      .attr('pointer-events', 'none')
      .style('text-shadow', '0 1px 3px rgba(0,0,0,0.25)')
      .text(d => states[String(d.id).padStart(2, '0')]?.abbr || '')

  }, [topoData, states, selectedState, onSelect, setTooltip, getMetric, colorRange])

  return (
    <div style={{ position: 'relative' }}>
      <svg ref={svgRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
      {tooltip && (
        <div className="tooltip-box" style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}>
          <div className="tt-name">{tooltip.name}</div>
          <div className="tt-pop">{metricLabel}: {tooltip.value?.toLocaleString()}</div>
        </div>
      )}
    </div>
  )
}
