import { useRef, useEffect } from 'react'
import * as d3 from 'd3'

/**
 * Generic animated line/area chart for a { periodLabel: value } series.
 * Used for anything trended over time (population by year, CPI by month,
 * unemployment rate by quarter, etc.) — any module can pass its own
 * series and formatting without a new component.
 *
 * props:
 *   series: { [period: string]: number }   e.g. { '2020': 79006400, ... }
 *   name: string                            unique-ish key, used for the gradient id
 *   color: string                           line/area color (defaults to gold)
 *   valueFormat: (v) => string              point label formatter
 *   axisFormat: (v) => string               y-axis tick formatter
 */
export default function TimeSeriesChart({ series, name, color = '#d99511', valueFormat, axisFormat }) {
  const svgRef = useRef(null)

  useEffect(() => {
    if (!svgRef.current || !series) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 25, right: 15, bottom: 30, left: 55 }
    const width = 640
    const height = 200
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    svg.attr('viewBox', `0 0 ${width} ${height}`)

    const entries = Object.entries(series)
    const periods = entries.map(d => d[0])
    const values = entries.map(d => d[1])

    const fmtValue = valueFormat || (v => v.toLocaleString())
    const fmtAxis = axisFormat || fmtValue

    const x = d3.scalePoint().domain(periods).range([0, innerW]).padding(0.15)
    const y = d3.scaleLinear()
      .domain([d3.min(values) * 0.985, d3.max(values) * 1.015])
      .range([innerH, 0])

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const gradId = `ts-grad-${(name || 'series').replace(/[^a-zA-Z0-9]/g, '')}`
    const defs = svg.append('defs')
    const gradient = defs.append('linearGradient')
      .attr('id', gradId)
      .attr('x1', '0').attr('y1', '0').attr('x2', '0').attr('y2', '1')
    gradient.append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', 0.25)
    gradient.append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', 0.02)

    const area = d3.area()
      .x(d => x(d[0]))
      .y0(innerH)
      .y1(d => y(d[1]))
      .curve(d3.curveMonotoneX)

    const areaPath = g.append('path')
      .datum(entries)
      .attr('fill', `url(#${gradId})`)
      .attr('d', area)
      .attr('opacity', 0)

    const line = d3.line()
      .x(d => x(d[0]))
      .y(d => y(d[1]))
      .curve(d3.curveMonotoneX)

    const linePath = g.append('path')
      .datum(entries)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2.5)
      .attr('d', line)

    const pathNode = linePath.node()
    if (pathNode) {
      const len = pathNode.getTotalLength()
      linePath
        .attr('stroke-dasharray', len)
        .attr('stroke-dashoffset', len)
        .transition()
        .duration(1200)
        .delay(100)
        .ease(d3.easeQuadOut)
        .attr('stroke-dashoffset', 0)

      areaPath
        .transition()
        .duration(600)
        .delay(900)
        .attr('opacity', 1)
    }

    entries.forEach(([period, val]) => {
      g.append('circle')
        .attr('cx', x(period))
        .attr('cy', y(val))
        .attr('r', 3.5)
        .attr('fill', '#fff')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('opacity', 0)
        .transition()
        .duration(300)
        .delay(1400)
        .attr('opacity', 1)

      g.append('text')
        .attr('x', x(period))
        .attr('y', y(val) - 10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-weight', '600')
        .attr('font-family', "'Lexend', sans-serif")
        .attr('fill', '#555550')
        .text(fmtValue(val))
        .attr('opacity', 0)
        .transition()
        .duration(300)
        .delay(1400)
        .attr('opacity', 1)
    })

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickSize(0).tickPadding(8))
      .select('.domain').remove()
      .selectAll('text')
      .attr('font-family', "'Source Sans 3', sans-serif")
      .attr('fill', '#555550')

    g.append('g')
      .call(d3.axisLeft(y).ticks(4).tickFormat(fmtAxis).tickSize(0).tickPadding(6))
      .select('.domain').remove()
      .selectAll('text')
      .attr('font-family', "'Source Sans 3', sans-serif")
      .attr('fill', '#555550')
      .style('font-variant-numeric', 'tabular-nums')

  }, [series, name, color, valueFormat, axisFormat])

  return <svg ref={svgRef} style={{ width: '100%', height: 'auto', maxHeight: 'clamp(140px, 26vw, 210px)' }} />
}
