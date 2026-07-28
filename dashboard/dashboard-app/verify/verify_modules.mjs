#!/usr/bin/env node
/**
 * verify_modules.mjs
 * Runtime verification: imports each module config and calls every accessor
 * against the real public/*.json data. Catches field-name typos that
 * build/lint cannot detect.
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import modules from '../src/modules/registry.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = join(__dirname, '..', 'public')

let failures = 0
let checks = 0

function check(label, fn) {
  checks++
  try {
    const result = fn()
    console.log(`  ok  ${label}`)
    return result
  } catch (e) {
    failures++
    console.log(`FAIL  ${label} -> ${e.message}`)
    return null
  }
}

for (const mod of modules) {
  console.log(`\n=== module: ${mod.id} ===`)

  let data
  try {
    data = JSON.parse(readFileSync(join(PUBLIC_DIR, mod.dataUrl.replace(/^\//, '')), 'utf-8'))
  } catch (e) {
    failures++
    console.log(`FAIL  Could not load ${mod.dataUrl}: ${e.message}`)
    continue
  }

  const states = data.states
  const stateList = Object.values(states)
  const sample = stateList[0]
  if (!sample) {
    failures++
    console.log('FAIL  No states found in data')
    continue
  }

  // Map metric
  check('mapMetric.getValue on all states', () => {
    let bad = 0
    for (const s of stateList) {
      const v = mod.mapMetric.getValue(s)
      if (!Number.isFinite(v)) bad++
    }
    if (bad > 0) throw new Error(`${bad} states returned non-finite value`)
    return { checked: stateList.length }
  })
  check('mapMetric.format', () => mod.mapMetric.format(mod.mapMetric.getValue(sample)))

  // Summary
  if (mod.summary) {
    check('summary(states)', () => mod.summary(states))
  }

  // Panel
  const panel = mod.panel
  if (panel.hero) check('panel.hero.getValue + format', () => panel.hero.format(panel.hero.getValue(sample)))
  if (panel.badge) check('panel.badge.getValue', () => panel.badge.getValue(sample))
  if (panel.rankBadge) check('panel.rankBadge.getValue', () => panel.rankBadge.getValue(sample))
  if (panel.quickStats) {
    panel.quickStats.forEach(qs => {
      check(`quickStats["${qs.label}"]`, () => qs.format ? qs.format(qs.getValue(sample)) : qs.getValue(sample))
    })
  }
  if (panel.sections) {
    panel.sections.forEach(sec => {
      check(`section["${sec.title}"] (${sec.type})`, () => {
        if (sec.type === 'timeseries') return sec.getSeries(sample)
        if (sec.type === 'flow') return sec.getRows(sample)
        if (sec.type === 'bars') return { groups: sec.getGroups(sample), total: sec.getTotal(sample) }
        if (sec.type === 'categories') return { groups: sec.getGroups(sample), total: sec.getTotal(sample) }
        throw new Error(`Unknown section type: ${sec.type}`)
      })
    })
  }

  // Ranking
  if (mod.ranking) {
    mod.ranking.columns.forEach(col => {
      check(`ranking["${col.key}"]`, () => {
        const v = col.getValue(sample)
        return col.format ? col.format(v, sample) : v
      })
    })
  }

  // Trend
  if (mod.trend) {
    check('trend accessors', () => {
      for (const s of stateList) {
        mod.trend.rankBy(s)
        for (const p of mod.trend.periods) mod.trend.getSeriesValue(s, p)
      }
      return `${stateList.length} states OK`
    })
  }

  // Exhaustive check across ALL states (catches DC, small-state edge cases)
  check('ALL states panel accessors (no throw)', () => {
    for (const s of stateList) {
      if (panel.hero) panel.hero.getValue(s)
      if (panel.badge) panel.badge.getValue(s)
      if (panel.quickStats) panel.quickStats.forEach(qs => qs.getValue(s))
      if (panel.sections) panel.sections.forEach(sec => {
        if (sec.type === 'timeseries') sec.getSeries(s)
        if (sec.type === 'flow') sec.getRows(s)
        if (sec.type === 'bars') { sec.getGroups(s); sec.getTotal(s) }
        if (sec.type === 'categories') { sec.getGroups(s); sec.getTotal(s) }
      })
    }
    return `${stateList.length} states`
  })
}

console.log(`\n--- Summary ---`)
console.log(`Modules checked: ${modules.length}`)
console.log(`Total checks: ${checks}`)
console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
