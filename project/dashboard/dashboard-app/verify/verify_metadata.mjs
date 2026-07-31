#!/usr/bin/env node
/**
 * verify_metadata.mjs
 * Checks that every module declares required metadata fields.
 * Looks for metadata.json in project/raw/{module.id}/ or module-level metadata.
 */
import { existsSync, readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import modules from '../src/modules/registry.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..', '..', '..')

const REQUIRED_FIELDS = [
  'id', 'label', 'owner', 'dataUrl', 'title', 'source',
  'mapMetric', 'panel',
]

const RECOMMENDED_FIELDS = [
  'summary', 'ranking', 'trend', 'views',
]

let issues = 0

function report(severity, msg) {
  issues++
  console.log(`  ${severity}  ${msg}`)
}

console.log('=== Module Metadata Verification ===\n')

for (const mod of modules) {
  console.log(`--- ${mod.id} ---`)

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (mod[field] === undefined || mod[field] === null) {
      report('FAIL', `Missing required field: ${field}`)
    }
  }

  // Check recommended fields
  for (const field of RECOMMENDED_FIELDS) {
    if (mod[field] === undefined || mod[field] === null) {
      report('WARN', `Missing recommended field: ${field}`)
    }
  }

  // Check dataUrl points to existing file
  if (mod.dataUrl) {
    const dataPath = join(__dirname, '..', 'public', mod.dataUrl.replace(/^\//, ''))
    if (!existsSync(dataPath)) {
      report('FAIL', `dataUrl "${mod.dataUrl}" -> file not found: ${dataPath}`)
    }
  }

  // Check mapMetric structure
  if (mod.mapMetric) {
    if (typeof mod.mapMetric.getValue !== 'function') {
      report('FAIL', 'mapMetric.getValue is not a function')
    }
    if (typeof mod.mapMetric.format !== 'function') {
      report('FAIL', 'mapMetric.format is not a function')
    }
    if (typeof mod.mapMetric.label !== 'string') {
      report('FAIL', 'mapMetric.label is not a string')
    }
    if (!Array.isArray(mod.mapMetric.colors) || mod.mapMetric.colors.length < 2) {
      report('WARN', 'mapMetric.colors should be an array with 2+ colors')
    }
  }

  // Check panel structure
  if (mod.panel) {
    if (mod.panel.hero) {
      if (typeof mod.panel.hero.getValue !== 'function') report('FAIL', 'panel.hero.getValue is not a function')
      if (typeof mod.panel.hero.format !== 'function') report('WARN', 'panel.hero.format is not a function')
      if (typeof mod.panel.hero.label !== 'string') report('FAIL', 'panel.hero.label is not a string')
    }
    if (mod.panel.sections) {
      for (const sec of mod.panel.sections) {
        if (!sec.title) report('FAIL', 'panel.section missing title')
        if (!sec.type) report('FAIL', `panel.section "${sec.title}" missing type`)
        if (!sec.getGroups && !sec.getSeries && !sec.getRows) {
          report('FAIL', `panel.section "${sec.title}" missing data accessor`)
        }
      }
    }
  }

  // Check raw directory exists
  const rawDir = join(PROJECT_ROOT, 'raw', mod.id)
  if (existsSync(rawDir)) {
    const files = readdirSync(rawDir).filter(f => !f.startsWith('.'))
    console.log(`  info  raw/ contains ${files.length} files`)
  } else {
    report('WARN', `raw/${mod.id}/ directory does not exist`)
  }

  console.log('')
}

console.log(`--- Summary ---`)
console.log(`Issues: ${issues}`)
console.log(issues === 0 ? 'ALL CHECKS PASSED' : `${issues} ISSUE(S) FOUND`)
process.exit(issues === 0 ? 0 : 1)
