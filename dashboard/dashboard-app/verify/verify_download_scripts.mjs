#!/usr/bin/env node
/**
 * verify_download_scripts.mjs
 * Static analysis of download scripts for common issues.
 * Checks for: retry logic, logging, timeout, error handling, metadata generation.
 */
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const SCRIPTS_DIR = join(ROOT, 'scripts')

let issues = 0

function report(severity, file, msg) {
  issues++
  console.log(`  ${severity}  ${file}: ${msg}`)
}

console.log('=== Download Script Analysis ===\n')

const scripts = [
  { name: 'download.py', path: join(SCRIPTS_DIR, 'download.py') },
  { name: 'download_economy.py', path: join(SCRIPTS_DIR, 'download_economy.py') },
]

const CHECKS = [
  { pattern: /retry|RETRY/i, name: 'Retry logic', severity: 'WARN' },
  { pattern: /logging|logger/i, name: 'Logging', severity: 'WARN' },
  { pattern: /timeout|TIMEOUT/i, name: 'Timeout configured', severity: 'WARN' },
  { pattern: /except|catch|error/i, name: 'Error handling', severity: 'FAIL' },
  { pattern: /User-Agent/i, name: 'User-Agent header', severity: 'INFO' },
  { pattern: /metadata|METADATA/i, name: 'Metadata generation', severity: 'WARN' },
  { pattern: /checksum|sha256|md5|hash/i, name: 'Checksum generation', severity: 'WARN' },
  { pattern: /validate|verify|check/i, name: 'Post-download validation', severity: 'WARN' },
  { pattern: /\.exists\(\)|skip|already/i, name: 'Skip-existing logic', severity: 'INFO' },
]

for (const script of scripts) {
  console.log(`--- ${script.name} ---`)
  if (!existsSync(script.path)) {
    report('FAIL', script.name, 'File not found')
    continue
  }

  const content = readFileSync(script.path, 'utf-8')
  const lines = content.split('\n')

  // Basic stats
  const funcCount = (content.match(/def \w+/g) || []).length
  const classCount = (content.match(/class \w+/g) || []).length
  console.log(`  info  ${lines.length} lines, ${funcCount} functions, ${classCount} classes`)

  // Run checks
  for (const check of CHECKS) {
    if (check.pattern.test(content)) {
      console.log(`  ok    ${check.name}`)
    } else {
      report(check.severity, script.name, `Missing: ${check.name}`)
    }
  }

  // Check for hardcoded paths (not URLs)
  const hardcodedPaths = content.match(/["'](?:C:|D:|\/home\/|\/Users\/)[^"']+["']/g)
  if (hardcodedPaths) {
    report('WARN', script.name, `Hardcoded absolute paths: ${hardcodedPaths[0]}`)
  } else {
    console.log(`  ok    No hardcoded absolute paths`)
  }

  // Check for dead code (unused imports)
  const imports = content.match(/^(?:from|import)\s+(\w+)/gm) || []
  console.log(`  info  Imports: ${imports.length}`)

  // Check for duplication (same function name pattern)
  const funcDefs = content.match(/def (\w+)/g) || []
  const uniqueFuncs = new Set(funcDefs)
  if (uniqueFuncs.size < funcDefs.length) {
    report('WARN', script.name, `Duplicate function definitions detected`)
  }

  console.log('')
}

console.log(`--- Summary ---`)
console.log(`Issues: ${issues}`)
console.log(issues === 0 ? 'ALL CHECKS PASSED' : `${issues} ISSUE(S) FOUND`)
process.exit(issues === 0 ? 0 : 1)
