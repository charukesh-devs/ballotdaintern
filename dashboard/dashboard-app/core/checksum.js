/**
 * core/checksum.js — SHA-256 checksum utilities
 */

import { createHash } from 'crypto'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { readdirSync, statSync } from 'fs'

export function sha256(filePath) {
  const content = readFileSync(filePath)
  return createHash('sha256').update(content).digest('hex')
}

export function generateChecksums(dir) {
  const checksums = {}
  const files = readdirSync(dir, { withFileTypes: true })

  for (const file of files) {
    if (file.isFile() && !file.name.endsWith('.json')) {
      const filePath = join(dir, file.name)
      const stat = statSync(filePath)
      checksums[file.name] = {
        sha256: sha256(filePath),
        size: stat.size,
        sizeHuman: formatBytes(stat.size),
      }
    }
  }

  return checksums
}

export function saveChecksums(dir, checksums) {
  const metaPath = join(dir, 'checksums.json')
  writeFileSync(metaPath, JSON.stringify(checksums, null, 2))
}

export function verifyChecksums(dir, expectedChecksums) {
  const results = []
  const files = readdirSync(dir, { withFileTypes: true })

  for (const file of files) {
    if (file.isFile() && !file.name.endsWith('.json')) {
      const filePath = join(dir, file.name)
      const actual = sha256(filePath)
      const expected = expectedChecksums[file.name]?.sha256

      results.push({
        file: file.name,
        match: actual === expected,
        actual,
        expected,
      })
    }
  }

  return results
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
