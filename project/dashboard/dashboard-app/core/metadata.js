/**
 * core/metadata.js — Metadata handling utilities
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

export function loadMetadata(moduleId, rawDir) {
  const metaPath = join(rawDir, moduleId, 'metadata.json')
  if (!existsSync(metaPath)) {
    return { error: `metadata.json not found for ${moduleId}`, path: metaPath }
  }

  try {
    const content = readFileSync(metaPath, 'utf8')
    return JSON.parse(content)
  } catch (err) {
    return { error: `Failed to parse metadata.json: ${err.message}`, path: metaPath }
  }
}

export function validateMetadata(meta) {
  const errors = []
  const warnings = []

  if (!meta.module_id) errors.push('Missing module_id')
  if (!meta.module_name) errors.push('Missing module_name')
  if (!meta.owner) warnings.push('Missing owner')
  if (!meta.datasets || !Array.isArray(meta.datasets)) {
    errors.push('Missing or invalid datasets array')
    return { errors, warnings, valid: false }
  }

  for (const ds of meta.datasets) {
    if (!ds.dataset_name) errors.push('Dataset missing dataset_name')
    if (!ds.source_url) warnings.push(`Dataset ${ds.dataset_name} missing source_url`)
    if (!ds.download_date) warnings.push(`Dataset ${ds.dataset_name} missing download_date`)
    if (!ds.checksum_sha256) warnings.push(`Dataset ${ds.dataset_name} missing checksum_sha256`)
  }

  return { errors, warnings, valid: errors.length === 0 }
}
