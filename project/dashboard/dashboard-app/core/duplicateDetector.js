/**
 * core/duplicateDetector.js — Duplicate file detection
 */

import { readdirSync, statSync } from 'fs'
import { join } from 'path'
import { sha256 } from './checksum.js'

export function detectDuplicates(dir) {
  const files = readdirSync(dir, { withFileTypes: true })
  const checksumMap = new Map()

  for (const file of files) {
    if (file.isFile() && !file.name.endsWith('.json')) {
      const filePath = join(dir, file.name)
      try {
        const checksum = sha256(filePath)
        if (!checksumMap.has(checksum)) {
          checksumMap.set(checksum, [])
        }
        checksumMap.get(checksum).push({
          name: file.name,
          path: filePath,
          size: statSync(filePath).size,
        })
      } catch (err) {
        console.error(`Failed to checksum ${file.name}:`, err.message)
      }
    }
  }

  const duplicates = []
  for (const [checksum, fileList] of checksumMap) {
    if (fileList.length > 1) {
      duplicates.push({
        checksum,
        files: fileList,
        count: fileList.length,
      })
    }
  }

  return {
    totalFiles: files.filter(f => f.isFile()).length,
    duplicateGroups: duplicates.length,
    duplicates,
  }
}
