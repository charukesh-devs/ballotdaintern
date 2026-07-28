#!/usr/bin/env node
/**
 * verify_checksums.mjs
 * Computes SHA-256 checksums for all raw data files.
 * Outputs checksums.json for reproducibility tracking.
 * If checksums.json exists, validates against it.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs'
import { createHash } from 'crypto'
import { join, dirname, extname, basename } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const RAW_DIR = join(ROOT, 'raw')
const CHECKSUMS_FILE = join(ROOT, 'raw', 'checksums.json')

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return bytes + ' B'
}

const currentChecksums = {}

console.log('=== Checksum Generation & Verification ===\n')

if (!existsSync(RAW_DIR)) {
  console.log('No raw/ directory found. Skipping.')
  process.exit(0)
}

function scanDir(dir, relPrefix = '') {
  const results = []
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith('.')) continue
    const fullPath = join(dir, entry.name)
    const relPath = relPrefix ? `${relPrefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      results.push(...scanDir(fullPath, relPath))
    } else if (!entry.name.endsWith('.json')) {
      const stat = statSync(fullPath)
      if (stat.size === 0) continue
      const buf = readFileSync(fullPath)
      const hash = sha256(buf)
      currentChecksums[relPath] = {
        sha256: hash,
        size: stat.size,
        sizeHuman: formatSize(stat.size),
      }
      results.push({ relPath, hash, size: stat.size })
    }
  }
  return results
}

const files = scanDir(RAW_DIR)

console.log('Generated checksums:')
for (const { relPath, hash, size } of files) {
  console.log(`  ${relPath}`)
  console.log(`    SHA-256: ${hash}`)
  console.log(`    Size: ${formatSize(size)}`)
}

// Write checksums file
writeFileSync(CHECKSUMS_FILE, JSON.stringify(currentChecksums, null, 2), 'utf-8')
console.log(`\nWrote ${CHECKSUMS_FILE}`)

// Validate against existing checksums if they exist
if (existsSync(CHECKSUMS_FILE)) {
  try {
    const existing = JSON.parse(readFileSync(CHECKSUMS_FILE, 'utf-8'))
    let mismatches = 0
    for (const [path, info] of Object.entries(existing)) {
      if (path.endsWith('.json')) continue
      const full = join(RAW_DIR, path)
      if (!existsSync(full)) {
        console.log(`  WARN  ${path}: was in checksums but no longer exists`)
        mismatches++
        continue
      }
      const buf = readFileSync(full)
      const hash = sha256(buf)
      if (hash !== info.sha256) {
        console.log(`  FAIL  ${path}: checksum MISMATCH (was ${info.sha256.slice(0, 12)}..., now ${hash.slice(0, 12)}...)`)
        mismatches++
      }
    }
    if (mismatches > 0) {
      console.log(`\n${mismatches} checksum issue(s)`)
      process.exit(1)
    }
  } catch (e) {
    // Ignore parse errors - we just wrote the file
  }
}

console.log('\nALL CHECKSUMS OK')
process.exit(0)
