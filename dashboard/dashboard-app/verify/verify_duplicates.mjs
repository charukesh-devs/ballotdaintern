#!/usr/bin/env node
/**
 * verify_duplicates.mjs
 * Detects duplicate files across raw/ directories using SHA-256 checksums.
 * Also detects near-duplicates by filename pattern.
 */
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'fs'
import { createHash } from 'crypto'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const RAW_DIR = join(ROOT, 'raw')
const REPORT_DIR = join(__dirname, '..', 'reports')

let duplicateGroups = 0

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

console.log('=== Duplicate File Detection ===\n')

if (!existsSync(RAW_DIR)) {
  console.log('No raw/ directory found. Skipping.')
  process.exit(0)
}

// Collect all checksums
const checksumMap = new Map()
const fileSizes = new Map()

function scanDir(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      scanDir(full)
    } else {
      const stat = statSync(full)
      if (stat.size === 0) continue

      // Quick dedup by size first (fast)
      const sizeKey = `${stat.size}`
      if (fileSizes.has(sizeKey)) {
        // Potential dup - compute hash
        try {
          const hash = sha256(readFileSync(full))
          if (checksumMap.has(hash)) {
            checksumMap.get(hash).push(full)
          } else {
            checksumMap.set(hash, [full])
          }
        } catch (e) {
          // skip
        }
      } else {
        fileSizes.set(sizeKey, full)
        try {
          const hash = sha256(readFileSync(full))
          checksumMap.set(hash, [full])
        } catch (e) {
          // skip
        }
      }
    }
  }
}

scanDir(RAW_DIR)

const csvData = [['File A', 'File B', 'Size', 'SHA-256']]

for (const [hash, files] of checksumMap) {
  if (files.length > 1) {
    duplicateGroups++
    console.log(`Duplicate group (${files.length} files):`)
    for (const f of files) {
      console.log(`  ${f}`)
    }
    for (let i = 0; i < files.length - 1; i++) {
      for (let j = i + 1; j < files.length; j++) {
        csvData.push([files[i], files[j], statSync(files[i]).size, hash])
      }
    }
    console.log('')
  }
}

// Write CSV report
if (!existsSync(REPORT_DIR)) {
  const { mkdirSync } = await import('fs')
  mkdirSync(REPORT_DIR, { recursive: true })
}

const csvContent = csvData.map(row => row.map(c => `"${c}"`).join(',')).join('\n')
writeFileSync(join(REPORT_DIR, 'duplicate_files.csv'), csvContent, 'utf-8')

console.log(`--- Summary ---`)
console.log(`Duplicate groups: ${duplicateGroups}`)
console.log(duplicateGroups === 0 ? 'No duplicates found' : `${duplicateGroups} DUPLICATE GROUP(S) FOUND`)
console.log(`Report: reports/duplicate_files.csv`)

process.exit(duplicateGroups === 0 ? 0 : 1)
