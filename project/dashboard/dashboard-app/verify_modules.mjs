// Runtime verification: import each module config and actually call every
// accessor against the real public/*.json data, the same way the React
// components would. Catches field-name typos that a build/lint pass can't.
import { readFileSync } from 'fs'
import modules from './src/modules/registry.js'

let failures = 0

function check(label, fn) {
  try {
    const result = fn()
    console.log(`  ok  ${label} ->`, JSON.stringify(result).slice(0, 120))
  } catch (e) {
    failures++
    console.log(`FAIL  ${label} ->`, e.message)
  }
}

for (const mod of modules) {
  console.log(`\n=== module: ${mod.id} ===`)
  const data = JSON.parse(readFileSync(`public${mod.dataUrl}`, 'utf-8'))
  const states = data.states
  const stateList = Object.values(states)
  const sample = stateList[0]
  const sampleFips = sample.fips

  check('mapMetric.getValue on all states', () => {
    let bad = 0
    for (const s of stateList) {
      const v = mod.mapMetric.getValue(s)
      if (!Number.isFinite(v)) bad++
    }
    return { bad, total: stateList.length }
  })
  check('mapMetric.format', () => mod.mapMetric.format(mod.mapMetric.getValue(sample)))

  if (mod.summary) {
    check('summary(states)', () => mod.summary(states))
  }

  const panel = mod.panel
  if (panel.hero) check('panel.hero', () => panel.hero.format(panel.hero.getValue(sample)))
  if (panel.badge) check('panel.badge', () => panel.badge.getValue(sample))
  if (panel.rankBadge) check('panel.rankBadge', () => panel.rankBadge.getValue(sample))
  if (panel.quickStats) {
    panel.quickStats.forEach(qs => check(`panel.quickStats["${qs.label}"]`, () => qs.format ? qs.format(qs.getValue(sample)) : qs.getValue(sample)))
  }
  if (panel.sections) {
    panel.sections.forEach(sec => {
      check(`panel.sections["${sec.title}"] (${sec.type})`, () => {
        if (sec.type === 'timeseries') return sec.getSeries(sample)
        if (sec.type === 'flow') return sec.getRows(sample)
        if (sec.type === 'bars') return { groups: sec.getGroups(sample), total: sec.getTotal(sample) }
        if (sec.type === 'categories') return { groups: sec.getGroups(sample), total: sec.getTotal(sample) }
      })
    })
  }

  if (mod.ranking) {
    mod.ranking.columns.forEach(col => {
      check(`ranking.columns["${col.key}"]`, () => {
        const v = col.getValue(sample)
        return col.format ? col.format(v, sample) : v
      })
    })
    // sort stability check across all states
    check('ranking columns across ALL states (no throw)', () => {
      let bad = 0
      for (const col of mod.ranking.columns) {
        for (const s of stateList) {
          const v = col.getValue(s)
          if (col.format) col.format(v, s)
          if (col.sortValue) col.sortValue(s)
        }
      }
      return { checkedColumns: mod.ranking.columns.length, checkedStates: stateList.length, bad }
    })
  }

  if (mod.trend) {
    check('trend.getSeriesValue + rankBy across ALL states', () => {
      for (const s of stateList) {
        mod.trend.rankBy(s)
        for (const p of mod.trend.periods) mod.trend.getSeriesValue(s, p)
      }
      return 'ok'
    })
  }

  // every state, not just sample, for map+panel core paths (catches missing-field edge cases e.g. DC)
  check('panel core accessors across ALL states', () => {
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
    return `${stateList.length} states checked`
  })
}

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`)
process.exit(failures === 0 ? 0 : 1)
