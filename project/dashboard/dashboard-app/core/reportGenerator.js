/**
 * core/reportGenerator.js — Report generation utilities
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

export function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

export function writeReport(dir, filename, content) {
  ensureDir(dir)
  const filePath = join(dir, filename)
  writeFileSync(filePath, typeof content === 'string' ? content : JSON.stringify(content, null, 2))
  return filePath
}

export function generateAuditReport(results, reportsDir) {
  const timestamp = new Date().toISOString()
  const totalChecks = results.reduce((sum, r) => sum + (r.checks || 0), 0)
  const passedChecks = results.reduce((sum, r) => sum + (r.passed || 0), 0)
  const failedChecks = totalChecks - passedChecks

  const audit = {
    timestamp,
    version: '1.0.0',
    summary: {
      totalChecks,
      passedChecks,
      failedChecks,
      passRate: totalChecks > 0 ? (passedChecks / totalChecks * 100).toFixed(1) + '%' : '0%',
    },
    results: results.map(r => ({
      name: r.name,
      status: r.status,
      checks: r.checks,
      passed: r.passed,
      failed: r.failed,
      issues: r.issues || [],
    })),
  }

  writeReport(reportsDir, 'audit.json', audit)
  return audit
}

export function generateQualityScore(audit, reportsDir) {
  const score = calculateScore(audit)
  const qualityScore = {
    timestamp: new Date().toISOString(),
    overall: score.overall,
    breakdown: score.breakdown,
    grade: score.grade,
    recommendations: score.recommendations,
  }

  writeReport(reportsDir, 'quality_score.json', qualityScore)
  return qualityScore
}

function calculateScore(audit) {
  const breakdown = {}
  let totalWeight = 0
  let weightedScore = 0

  const weights = {
    'Repository Health': 0.2,
    'Raw Data Integrity': 0.25,
    'Module Metadata': 0.15,
    'Module Accessors': 0.2,
    'Checksums': 0.1,
    'Data Sources': 0.05,
    'Duplicate Detection': 0.025,
    'Download Scripts': 0.025,
  }

  for (const result of audit.results) {
    const weight = weights[result.name] || 0
    const passRate = result.checks > 0 ? (result.passed / result.checks) * 100 : 0
    breakdown[result.name] = {
      score: Math.round(passRate),
      weight,
      weightedScore: Math.round(passRate * weight),
    }
    totalWeight += weight
    weightedScore += passRate * weight
  }

  const overall = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0
  let grade = 'F'
  if (overall >= 90) grade = 'A'
  else if (overall >= 80) grade = 'B'
  else if (overall >= 70) grade = 'C'
  else if (overall >= 60) grade = 'D'

  const recommendations = []
  for (const [name, info] of Object.entries(breakdown)) {
    if (info.score < 80) {
      recommendations.push(`Improve ${name} (currently ${info.score}%)`)
    }
  }

  return { overall, breakdown, grade, recommendations }
}
