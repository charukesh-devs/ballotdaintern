/**
 * core/validator.js — Schema validation for module configs and data
 */

import { readFileSync } from 'fs'
import { join } from 'path'

const MODULE_SCHEMA = {
  required: ['id', 'label', 'icon', 'dataUrl', 'title', 'source', 'mapMetric', 'panel'],
  optional: ['owner', 'summary', 'ranking', 'trend', 'periodScrubber'],
  mapMetric: {
    required: ['getValue', 'format'],
    optional: ['unit'],
  },
  panel: {
    required: ['hero', 'badge'],
    optional: ['rankBadge', 'quickStats', 'sections'],
  },
}

export function validateModuleConfig(config, filePath) {
  const errors = []
  const warnings = []

  for (const field of MODULE_SCHEMA.required) {
    if (!(field in config)) {
      errors.push(`Missing required field: ${field}`)
    }
  }

  for (const field of MODULE_SCHEMA.optional) {
    if (!(field in config)) {
      warnings.push(`Missing recommended field: ${field}`)
    }
  }

  if (config.mapMetric) {
    for (const field of MODULE_SCHEMA.mapMetric.required) {
      if (typeof config.mapMetric[field] !== 'function') {
        errors.push(`mapMetric.${field} must be a function`)
      }
    }
  }

  if (config.panel) {
    if (config.panel.quickStats) {
      for (const [key, stat] of Object.entries(config.panel.quickStats)) {
        if (!stat.getValue) errors.push(`panel.quickStats["${key}"].getValue missing`)
        if (!stat.format) errors.push(`panel.quickStats["${key}"].format missing`)
      }
    }
  }

  return { errors, warnings, valid: errors.length === 0 }
}

export function validateDataShape(data, config) {
  const errors = []

  if (!data || typeof data !== 'object') {
    errors.push('Data is not an object')
    return { errors, valid: false }
  }

  if (!data.states || typeof data.states !== 'object') {
    errors.push('Data missing "states" object')
    return { errors, valid: false }
  }

  const states = Object.keys(data.states)
  if (states.length === 0) {
    errors.push('Data has no states')
    return { errors, valid: false }
  }

  const sampleState = data.states[states[0]]
  if (!sampleState.name) errors.push('State missing "name" field')
  if (!sampleState.abbr) errors.push('State missing "abbr" field')
  if (!sampleState.fips) errors.push('State missing "fips" field')

  return { errors, valid: errors.length === 0, stateCount: states.length }
}
