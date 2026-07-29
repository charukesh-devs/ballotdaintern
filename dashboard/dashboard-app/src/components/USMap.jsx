import { useRef, useEffect, useState, useCallback } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'

const SMALL_STATES = new Set(['09', '10', '11', '24', '25', '33', '34', '44', '50'])

const DEFAULT_COLORS = ['#e6f1fb', '#c5dff5', '#94c8eb', '#6baed6', '#378add', '#1a5bd6', '#0c447c']

export default function USMap({ states, metric, selectedState, onSelect, tooltip, setTooltip }) {
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  const [topoData, setTopoData] = useState(null)
  const [hoveredFips, setHoveredFips] = useState(null)

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

    const getValue = metric.getValue
    const values = Object.values(states).map(getValue).filter(v => Number.isFinite(v))
    const colorScale = d3.scaleQuantize()
      .domain([d3.min(values), d3.max(values)])
      .range(metric.colors && metric.colors.length ? metric.colors : DEFAULT_COLORS)

    const defs = svg.append('defs')

    defs.append('filter')
      .attr('id', 'map-glow')
      .append('feDropShadow')
      .attr('dx', 0).attr('dy', 0).attr('stdDeviation', 5).attr('flood-color', '#f5b02e').attr('flood-opacity', 0.7)

    defs.append('filter')
      .attr('id', 'state-shadow')
      .append('feDropShadow')
      .attr('dx', 1).attr('dy', 2).attr('stdDeviation', 2).attr('flood-color', '#000').attr('flood-opacity', 0.12)

    defs.append('radialGradient')
      .attr('id', 'hover-glow')
      .append('stop')
      .attr('offset', '50%').attr('stop-color', '#fff').attr('stop-opacity', 0.15)

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
        const v = s ? getValue(s) : null
        return Number.isFinite(v) ? colorScale(v) : '#eee'
      })
      .attr('stroke', d => {
        const fips = String(d.id).padStart(2, '0')
        if (fips === selectedState) return '#f5b02e'
        if (fips === hoveredFips) return '#071633'
        return '#fff'
      })
      .attr('stroke-width', d => {
        const fips = String(d.id).padStart(2, '0')
        if (fips === selectedState) return 3.5
        if (fips === hoveredFips) return 2.5
        return 1
      })
      .attr('filter', d => {
        const fips = String(d.id).padStart(2, '0')
        return fips === selectedState ? 'url(#map-glow)' : 'url(#state-shadow)'
      })
      .style('cursor', 'pointer')
      .style('transition', 'fill 0.25s ease, stroke 0.2s ease, stroke-width 0.2s ease')
      .on('mouseenter', function (e, d) {
        const fips = String(d.id).padStart(2, '0')
        const s = states[fips]
        if (!s) return
        setHoveredFips(fips)
        d3.select(this).raise()
        setTooltip({
          x: e.clientX,
          y: e.clientY,
          name: s.name,
          value: getValue(s),
          abbr: s.abbr,
        })
      })
      .on('mousemove', function (e) {
        setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)
      })
      .on('mouseleave', function () {
        setHoveredFips(null)
        setTooltip(null)
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
        const v = getValue(s)
        const domain = colorScale.domain()
        const isDark = Number.isFinite(v) && v > domain[0] + (domain[1] - domain[0]) * 0.55
        return isDark ? '#fff' : '#444'
      })
      .attr('font-size', d => {
        const fips = String(d.id).padStart(2, '0')
        return SMALL_STATES.has(fips) ? '7px' : '10px'
      })
      .attr('font-weight', '700')
      .attr('font-family', "'Lexend', sans-serif")
      .attr('pointer-events', 'none')
      .style('text-shadow', '0 1px 4px rgba(0,0,0,0.3)')
      .text(d => states[String(d.id).padStart(2, '0')]?.abbr || '')

    const legendG = svg.append('g')
      .attr('transform', `translate(${width - 230}, ${height - 75})`)
      .attr('class', 'map-legend')

    const legendColors = colorScale.range()
    const legendDomain = colorScale.domain()
    const legendWidth = 190
    const legendHeight = 12

    legendG.append('text')
      .attr('x', 0).attr('y', -8)
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('font-family', "'Lexend', sans-serif")
      .attr('fill', '#555550')
      .text(metric.label)

    const legendScale = d3.scaleLinear()
      .domain([legendDomain[0], legendDomain[1]])
      .range([0, legendWidth])

    const legendTicks = legendScale.ticks(4)
    const tickFormat = metric.format || (d => d.toLocaleString())

    const legendRectW = legendWidth / legendColors.length
    legendG.selectAll('rect')
      .data(legendColors)
      .join('rect')
      .attr('x', (d, i) => i * legendRectW)
      .attr('y', 0)
      .attr('width', legendRectW + 0.5)
      .attr('height', legendHeight)
      .attr('fill', d => d)

    legendG.append('rect')
      .attr('x', 0).attr('y', 0)
      .attr('width', legendWidth).attr('height', legendHeight)
      .attr('fill', 'none')
      .attr('stroke', '#ddd')
      .attr('rx', 2)

    legendG.selectAll('text.tick')
      .data(legendTicks)
      .join('text')
      .attr('class', 'tick')
      .attr('x', d => legendScale(d))
      .attr('y', legendHeight + 14)
      .attr('text-anchor', 'middle')
      .attr('font-size', '8.5px')
      .attr('font-family', "'Source Sans 3', sans-serif")
      .attr('fill', '#888')
      .text(d => tickFormat(d))

  }, [topoData, states, metric, selectedState, onSelect, setTooltip, hoveredFips])

  return (
    <div ref={containerRef} className="map-card" style={{ position: 'relative' }}>
      <svg ref={svgRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
      <div className="map-watermark">AMERICA250</div>
      {tooltip && (
        <div className="tooltip-box" style={{ left: tooltip.x + 14, top: tooltip.y - 14 }}>
          <div className="tt-name">
            {tooltip.name}
            <span className="tt-abbr">{tooltip.abbr}</span>
          </div>
          <div className="tt-pop">{metric.label}: {metric.format ? metric.format(tooltip.value) : tooltip.value}</div>
        </div>
      )}
    </div>
  )
}
