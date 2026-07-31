#!/usr/bin/env node
/**
 * verify_raw_data.mjs
 * Scans raw/ directories for each module, checks file health.
 * Reports: readable, not empty, valid format, encoding, duplicates by checksum.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { createHash } from 'crypto'
import { join, extname, basename } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(fileURLToPath(import.meta.url), '..', '..', '..', '..')
const RAW_DIR = join(ROOT, 'raw')

const ALLOWED_EXTENSIONS = new Set(['.csv', '.json', '.txt', '.dat', '.zip', '.tsv', '.parquet', '.geojson'])
const WARN_EXTENSIONS = new Set(['.pyc', '.tmp', '.bak', '.orig'])

let issues = 0
let filesChecked = 0
let totalSize = 0

function report(severity, file, msg) {
  issues++
  const tag = severity === 'FAIL' ? 'FAIL' : severity === 'WARN' ? 'WARN' : 'INFO'
  console.log(`  ${tag}  ${file}: ${msg}`)
}

function checksum(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

function checkFile(filepath) {
  const name = basename(filepath)
  const ext = extname(filepath).toLowerCase()

  // Skip hidden files
  if (name.startsWith('.')) return

  filesChecked++

  let stat
  try {
    stat = statSync(filepath)
  } catch (e) {
    report('FAIL', filepath, `Cannot stat: ${e.message}`)
    return
  }

  totalSize += stat.size

  // Empty check
  if (stat.size === 0) {
    report('FAIL', filepath, 'File is empty (0 bytes)')
    return
  }

  // Suspicious extension
  if (WARN_EXTENSIONS.has(ext)) {
    report('WARN', filepath, `Suspicious extension: ${ext}`)
  }

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    report('WARN', filepath, `Unknown extension: ${ext} (not in allowed list)`)
  }

  // Try to read for text-based files
  if (['.csv', '.json', '.txt', '.dat', '.tsv'].includes(ext)) {
    try {
      const content = readFileSync(filepath, { encoding: 'utf-8' })

      // Check for null bytes (binary contamination)
      if (content.includes('\0')) {
        report('WARN', filepath, 'Contains null bytes - may be binary data saved as text')
      }

      // Check first few bytes for readability
      const sample = content.slice(0, 200)
      const printableRatio = sample.split('').filter(c => c.charCodeAt(0) >= 32 || c === '\n' || c === '\r' || c === '\t').length / sample.length
      if (printableRatio < 0.8) {
        report('WARN', filepath, `Low printable character ratio (${(printableRatio * 100).toFixed(1)}%) - possible encoding issue`)
      }

      // JSON-specific validation
      if (ext === '.json') {
        try {
          JSON.parse(content)
        } catch (e) {
          report('FAIL', filepath, `Invalid JSON: ${e.message}`)
        }
      }

      // CSV: check for consistent column count
      if (ext === '.csv') {
        const lines = content.split('\n').filter(l => l.trim())
        if (lines.length > 1) {
          const firstCols = lines[0].split(',').length
          const inconsistent = lines.slice(1, 20).filter(l => l.split(',').length !== firstCols).length
          if (inconsistent > 0) {
            report('WARN', filepath, `Inconsistent column count in first 20 rows (expected ${firstCols})`)
          }
        }
      }

    } catch (e) {
      report('FAIL', filepath, `Cannot read as UTF-8: ${e.message}`)
    }
  }
}

// Main scan
console.log('=== Raw Data Verification ===\n')

if (!existsSync(RAW_DIR)) {
  console.log('No raw/ directory found. Skipping.')
  process.exit(0)
}

const checksums = new Map()

function scanDir(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      scanDir(join(dir, entry.name))
    } else {
      const filepath = join(dir, entry.name)
      checkFile(filepath)

      // Track checksums for duplicate detection
      try {
        const buf = readFileSync(filepath)
        const hash = checksum(buf)
        if (checksums.has(hash)) {
          report('WARN', filepath, `Duplicate of ${checksums.get(hash)} (same SHA-256)`)
        } else {
          checksums.set(hash, filepath)
        }
      } catch (e) {
        // Skip checksum on read failure
      }
    }
  }
}

scanDir(RAW_DIR)

const sizeMB = (totalSize / 1024 / 1024).toFixed(1)
console.log(`\n--- Summary ---`)
console.log(`Files checked: ${filesChecked}`)
console.log(`Total size: ${sizeMB} MB`)
console.log(`Duplicate groups: ${checksums.size < filesChecked ? 'DETECTED' : 'None'}`)
console.log(`Issues: ${issues}`)
console.log(issues === 0 ? '\nALL CHECKS PASSED' : `\n${issues} ISSUE(S) FOUND`)

process.exit(issues === 0 ? 0 : 1)
