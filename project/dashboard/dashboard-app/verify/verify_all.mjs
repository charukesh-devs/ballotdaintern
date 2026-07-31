#!/usr/bin/env node
/**
 * verify_all.mjs
 * Master verification runner. Executes all verifiers and generates reports.
 *
 * Usage: node verify/verify_all.mjs
 * Or:    npm run verify
 */
import { execSync } from 'child_process'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPORT_DIR = join(__dirname, '..', 'reports')
const START = Date.now()

if (!existsSync(REPORT_DIR)) {
  mkdirSync(REPORT_DIR, { recursive: true })
}

const verifiers = [
  { name: 'Repository Health', script: 'verify_repository.mjs' },
  { name: 'Raw Data Integrity', script: 'verify_raw_data.mjs' },
  { name: 'Module Metadata', script: 'verify_metadata.mjs' },
  { name: 'Module Accessors', script: 'verify_modules.mjs' },
  { name: 'Checksums', script: 'verify_checksums.mjs' },
  { name: 'Data Sources', script: 'verify_sources.mjs' },
  { name: 'Duplicate Detection', script: 'verify_duplicates.mjs' },
  { name: 'Download Scripts', script: 'verify_download_scripts.mjs' },
]

const results = []
let overallPass = true

console.log('╔══════════════════════════════════════════════════════════╗')
console.log('║          AMERICA250 DATA WAREHOUSE — VERIFY ALL         ║')
console.log('╚══════════════════════════════════════════════════════════╝')
console.log('')

for (const v of verifiers) {
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`Running: ${v.name}`)
  console.log(`${'─'.repeat(60)}`)

  const start = Date.now()
  let passed = false
  let output = ''

  try {
    output = execSync(`node "${join(__dirname, v.script)}"`, {
      encoding: 'utf-8',
      timeout: 120000,
      cwd: join(__dirname, '..'),
    })
    passed = true
    console.log(output)
  } catch (e) {
    output = (e.stdout || '') + '\n' + (e.stderr || '')
    console.log(output)
    passed = e.status === 0
    if (!passed) overallPass = false
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  results.push({
    name: v.name,
    script: v.script,
    passed,
    elapsed: `${elapsed}s`,
    output: output.slice(0, 2000),
  })
}

const elapsed = ((Date.now() - START) / 1000).toFixed(1)

// Write JSON report
const report = {
  timestamp: new Date().toISOString(),
  elapsed: `${elapsed}s`,
  overallPass,
  results,
}
writeFileSync(join(REPORT_DIR, 'audit.json'), JSON.stringify(report, null, 2), 'utf-8')

// Write markdown report
let md = `# America250 Data Warehouse — Audit Report\n\n`
md += `**Generated:** ${new Date().toISOString()}\n`
md += `**Elapsed:** ${elapsed}s\n`
md += `**Overall:** ${overallPass ? '✅ PASS' : '❌ FAIL'}\n\n`
md += `## Results\n\n`
md += `| Verifier | Status | Time |\n`
md += `|----------|--------|------|\n`
for (const r of results) {
  md += `| ${r.name} | ${r.passed ? '✅ PASS' : '❌ FAIL'} | ${r.elapsed} |\n`
}
md += `\n## Details\n\n`
for (const r of results) {
  md += `### ${r.name}\n\n`
  md += `\`\`\`\n${r.output.slice(0, 3000)}\n\`\`\`\n\n`
}
writeFileSync(join(REPORT_DIR, 'audit.md'), md, 'utf-8')

// Write quality score
const passedCount = results.filter(r => r.passed).length
const score = Math.round((passedCount / results.length) * 100)
writeFileSync(join(REPORT_DIR, 'quality_score.json'), JSON.stringify({
  score,
  passed: passedCount,
  total: results.length,
  timestamp: new Date().toISOString(),
}, null, 2), 'utf-8')

console.log(`\n${'═'.repeat(60)}`)
console.log(`RESULTS: ${passedCount}/${results.length} passed | Score: ${score}/100`)
console.log(`Total time: ${elapsed}s`)
console.log(`Reports written to: reports/`)
console.log(`${'═'.repeat(60)}`)

process.exit(overallPass ? 0 : 1)
