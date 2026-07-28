import { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'

const SMALL_STATES = new Set(['09', '10', '11', '24', '25', '33', '34', '44', '50'])

const DEFAULT_COLORS = ['#e6f1fb', '#c5dff5', '#94c8eb', '#6baed6', '#378add', '#1a5bd6', '#0c447c']

/**
 * Generic choropleth map. Which value colors each state (and how it's
 * formatted/labeled) is entirely driven by `metric`, so any module can
 * reuse this component without touching this file.
 *
 * metric shape:
 *   {
 *     getValue: (stateRecord) => number,
 *     format: (value) => string,
 *     label: string,          // shown in the tooltip, e.g. "Population"
 *     colors: string[],       // optional, defaults to the blue scale below
 *   }
 */
export default function USMap({ states, metric, selectedState, onSelect, tooltip, setTooltip }) {
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

    const getValue = metric.getValue
    const values = Object.values(states).map(getValue).filter(v => Number.isFinite(v))
    const colorScale = d3.scaleQuantize()
      .domain([d3.min(values), d3.max(values)])
      .range(metric.colors && metric.colors.length ? metric.colors : DEFAULT_COLORS)

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
        setTooltip({
          x: e.clientX,
          y: e.clientY,
          name: s.name,
          value: getValue(s),
        })
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
        const v = getValue(s)
        const domain = colorScale.domain()
        const isDark = Number.isFinite(v) && v > domain[0] + (domain[1] - domain[0]) * 0.65
        return isDark ? '#fff' : '#444'
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

  }, [topoData, states, metric, selectedState, onSelect, setTooltip])

  return (
    <div style={{ position: 'relative' }}>
      <svg ref={svgRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
      {tooltip && (
        <div className="tooltip-box" style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}>
          <div className="tt-name">{tooltip.name}</div>
          <div className="tt-pop">{metric.label}: {metric.format ? metric.format(tooltip.value) : tooltip.value}</div>
        </div>
      )}
    </div>
  )
}
