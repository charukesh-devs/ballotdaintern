#!/usr/bin/env node
/**
 * verify_sources.mjs
 * Validates that all module data sources are official government URLs.
 * Checks for http:// (should be https://), known dead domains, etc.
 */
import modules from '../src/modules/registry.js'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

let issues = 0

function report(severity, msg) {
  issues++
  console.log(`  ${severity}  ${msg}`)
}

const OFFICIAL_DOMAINS = [
  'census.gov',
  'bls.gov',
  'bea.gov',
  'usgs.gov',
  'noaa.gov',
  'epa.gov',
  'hud.gov',
  'fhfa.gov',
  'dot.gov',
  'usda.gov',
  'eia.gov',
  'cdc.gov',
  'nces.ed.gov',
  'fec.gov',
  'usa.gov',
  'congress.gov',
  'data.census.gov',
  'api.census.gov',
  'www2.census.gov',
  'api.bls.gov',
  'download.bls.gov',
  'apps.bea.gov',
]

const SUSPICIOUS_PATTERNS = [
  /github\.com/i,
  /gitlab\.com/i,
  /stackoverflow\.com/i,
  /wikipedia\.org/i,
  /kaggle\.com/i,
  /dataworld\.com/i,
]

console.log('=== Source Validation ===\n')

// Check module configs
for (const mod of modules) {
  console.log(`--- ${mod.id} ---`)

  if (mod.source) {
    const sources = Array.isArray(mod.source) ? mod.source : [mod.source]
    for (const src of sources) {
      // Extract URLs from source string
      const urls = src.match(/https?:\/\/[^\s,;)]+/g) || []
      for (const url of urls) {
        if (!url.startsWith('https://')) {
          report('WARN', `HTTP (not HTTPS): ${url}`)
        }
        const isOfficial = OFFICIAL_DOMAINS.some(d => url.includes(d))
        if (!isOfficial) {
          report('WARN', `Source URL not from known official domain: ${url}`)
        }
        const isSuspicious = SUSPICIOUS_PATTERNS.some(p => p.test(url))
        if (isSuspicious) {
          report('FAIL', `Suspicious source URL: ${url}`)
        }
      }
    }
    console.log(`  info  Source: ${typeof mod.source === 'string' ? mod.source.slice(0, 80) + '...' : 'array'}`)
  }

  // Check dataUrl
  if (mod.dataUrl) {
    const dataPath = join(__dirname, '..', 'public', mod.dataUrl.replace(/^\//, ''))
    if (existsSync(dataPath)) {
      try {
        const data = JSON.parse(readFileSync(dataPath, 'utf-8'))
        if (data.metadata?.sources) {
          console.log(`  info  Data sources: ${data.metadata.sources.length} declared`)
          for (const s of data.metadata.sources) {
            console.log(`    - ${s}`)
          }
        }
      } catch (e) {
        report('WARN', `Could not read metadata from ${mod.dataUrl}`)
      }
    }
  }

  console.log('')
}

console.log(`--- Summary ---`)
console.log(`Issues: ${issues}`)
console.log(issues === 0 ? 'ALL SOURCES VALID' : `${issues} ISSUE(S) FOUND`)
process.exit(issues === 0 ? 0 : 1)
