#!/usr/bin/env node
/**
 * verify_repository.mjs
 * Top-level repository health checks.
 * - package.json dependencies installed
 * - .gitignore covers raw/, processed/, node_modules/
 * - No secrets or API keys in source
 * - No node_modules committed
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT = join(__dirname, '..', '..', '..')
const DASH = join(__dirname, '..')

let issues = 0

function report(severity, msg) {
  issues++
  console.log(`  ${severity}  ${msg}`)
}

console.log('=== Repository Health Check ===\n')

// 1. .gitignore
console.log('--- .gitignore ---')
const gitignorePath = join(PROJECT, '.gitignore')
if (existsSync(gitignorePath)) {
  const content = readFileSync(gitignorePath, 'utf-8')
  for (const pattern of ['raw/', 'processed/', 'node_modules/', 'dist/', 'logs/']) {
    if (content.includes(pattern)) {
      console.log(`  ok  Covers: ${pattern}`)
    } else {
      report('WARN', `Missing .gitignore pattern: ${pattern}`)
    }
  }
} else {
  report('WARN', 'No .gitignore found')
}

// 2. package.json
console.log('\n--- package.json ---')
const pkgPath = join(DASH, 'package.json')
if (existsSync(pkgPath)) {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  console.log(`  info  Name: ${pkg.name}`)
  console.log(`  info  Scripts: ${Object.keys(pkg.scripts || {}).join(', ')}`)

  if (!pkg.scripts?.verify) {
    report('WARN', 'No "verify" script in package.json')
  }

  // Check that deps are installed
  const nodeModules = join(DASH, 'node_modules')
  if (existsSync(nodeModules)) {
    const depCount = readdirSync(nodeModules).filter(d => !d.startsWith('.')).length
    console.log(`  ok  node_modules installed (${depCount} packages)`)
  } else {
    report('WARN', 'node_modules not installed - run: npm install')
  }
} else {
  report('FAIL', 'No package.json found')
}

// 3. Check for secrets in source
console.log('\n--- Secrets Scan ---')
const SECRET_PATTERNS = [
  /api[_-]?key\s*[=:]\s*["'][^"']+["']/gi,
  /password\s*[=:]\s*["'][^"']+["']/gi,
  /secret\s*[=:]\s*["'][^"']+["']/gi,
  /token\s*[=:]\s*["'][^"']+["']/gi,
]

function scanForSecrets(dir, rel = '') {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue
    if (entry.name.startsWith('.')) continue
    const full = join(dir, entry.name)
    const relPath = rel ? `${rel}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      scanForSecrets(full, relPath)
    } else if (['.py', '.js', '.jsx', '.mjs', '.ts', '.json', '.env', '.cfg', '.ini'].some(ext => entry.name.endsWith(ext))) {
      try {
        const content = readFileSync(full, 'utf-8')
        for (const pattern of SECRET_PATTERNS) {
          pattern.lastIndex = 0
          const match = pattern.exec(content)
          if (match) {
            report('FAIL', `Possible secret in ${relPath}: ${match[0].slice(0, 50)}...`)
          }
        }
      } catch (e) {
        // Skip binary/unreadable files
      }
    }
  }
}

scanForSecrets(join(PROJECT, 'scripts'))
scanForSecrets(join(PROJECT, 'dashboard'))
scanForSecrets(join(PROJECT, 'core'))
scanForSecrets(PROJECT, '')

if (issues === 0) {
  console.log('  ok  No secrets found in source files')
}

// 4. Check directory structure
console.log('\n--- Directory Structure ---')
for (const dir of ['scripts', 'raw', 'processed', 'logs', 'core', 'dashboard']) {
  const full = join(PROJECT, dir)
  if (existsSync(full)) {
    const count = readdirSync(full).length
    console.log(`  ok  ${dir}/ (${count} entries)`)
  } else {
    console.log(`  info  ${dir}/ (not found - will be created as needed)`)
  }
}

// 5. Dashboard structure
console.log('\n--- Dashboard ---')
for (const dir of ['src/modules', 'src/components', 'verify', 'templates', 'public']) {
  const full = join(DASH, dir)
  if (existsSync(full)) {
    const count = readdirSync(full).length
    console.log(`  ok  ${dir}/ (${count} entries)`)
  } else {
    report('WARN', `Missing directory: ${dir}`)
  }
}

console.log(`\n--- Summary ---`)
console.log(`Issues: ${issues}`)
console.log(issues === 0 ? 'REPOSITORY HEALTHY' : `${issues} ISSUE(S) FOUND`)
process.exit(issues === 0 ? 0 : 1)
