/**
 * core/fileScanner.js — Directory and file scanning utilities
 */

import { readdirSync, statSync, existsSync } from 'fs'
import { join, extname } from 'path'

export function scanDirectory(dir, options = {}) {
  const { recursive = false, extensions = [], minSize = 0, maxSize = Infinity } = options

  if (!existsSync(dir)) {
    return { files: [], totalSize: 0, error: `Directory not found: ${dir}` }
  }

  const files = []
  const entries = readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)

    if (entry.isDirectory() && recursive) {
      const subResult = scanDirectory(fullPath, options)
      files.push(...subResult.files)
    } else if (entry.isFile()) {
      const stat = statSync(fullPath)
      const ext = extname(entry.name).toLowerCase()

      if (extensions.length > 0 && !extensions.includes(ext)) continue
      if (stat.size < minSize || stat.size > maxSize) continue

      files.push({
        name: entry.name,
        path: fullPath,
        size: stat.size,
        sizeHuman: formatBytes(stat.size),
        ext,
        modified: stat.mtime.toISOString(),
      })
    }
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0)
  return { files, totalSize, totalSizeHuman: formatBytes(totalSize) }
}

export function getFileStats(dir) {
  const result = scanDirectory(dir, { recursive: true })
  const byExt = {}

  for (const file of result.files) {
    byExt[file.ext] = (byExt[file.ext] || 0) + 1
  }

  return {
    totalFiles: result.files.length,
    totalSize: result.totalSizeHuman,
    byExtension: byExt,
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
