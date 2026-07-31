/**
 * core/sourceValidator.js — Source URL validation
 */

const GOVERNMENT_DOMAINS = [
  'census.gov',
  'bls.gov',
  'bea.gov',
  'data.gov',
  'nass.usda.gov',
  'ers.usda.gov',
  'cdc.gov',
  'epa.gov',
  'noaa.gov',
  'usgs.gov',
  'nasa.gov',
  'sec.gov',
  'fdic.gov',
  'treasury.gov',
  'usda.gov',
  'hhs.gov',
  'cms.gov',
  'irs.gov',
  'ssa.gov',
  'va.gov',
  'dol.gov',
  'dot.gov',
  'doe.gov',
  'doi.gov',
  'ed.gov',
  'hud.gov',
  'usaid.gov',
  'niaid.nih.gov',
  'nlm.nih.gov',
  'ncbi.nlm.nih.gov',
]

export function isGovernmentSource(url) {
  if (!url) return false
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    return GOVERNMENT_DOMAINS.some(domain => hostname.endsWith(domain))
  } catch {
    return false
  }
}

export function validateSourceUrl(url) {
  if (!url) return { valid: false, reason: 'No URL provided' }

  try {
    const parsed = new URL(url)

    if (parsed.protocol !== 'https:') {
      return { valid: false, reason: 'Not HTTPS' }
    }

    const isGov = isGovernmentSource(url)
    return {
      valid: true,
      isGovernment: isGov,
      hostname: parsed.hostname,
      warning: isGov ? null : 'Not a government domain — verify this is an official source',
    }
  } catch {
    return { valid: false, reason: 'Invalid URL format' }
  }
}

export function validateSources(moduleConfig) {
  const results = []

  if (moduleConfig.source) {
    results.push({
      field: 'source',
      ...validateSourceUrl(moduleConfig.source),
    })
  }

  return results
}
