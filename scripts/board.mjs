#!/usr/bin/env node
// Read claims/<marker>.json and show who is touching which paths right now.
//
// Why per-session files instead of one shared table: each session owns exactly
// one file, so concurrent edits never touch the same lines. Git merges them on
// its own and nobody needs a lock or a "may I start" round-trip. Overlapping
// scopes are printed as warnings -- visible friction, not a gate.
//
// usage: node scripts/board.mjs [--check] [--json]
//   --check  exit 1 only on structural problems (bad JSON, wrong filename,
//            duplicate marker, bad scope, bad lease). Expired leases and
//            overlapping scopes stay warnings so a stale claim never breaks CI.
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const claimsDir = path.join(root, 'claims')
const checkMode = process.argv.includes('--check')
const jsonMode = process.argv.includes('--json')
const now = Date.now()
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/u

const problems = []
const warnings = []
const claims = []

const problem = (file, message) => problems.push(file + ': ' + message)
const warn = (message) => warnings.push(message)

if (!fs.existsSync(claimsDir)) {
  warn('claims/ does not exist yet -- no session has declared its scope')
} else {
  const entries = fs.readdirSync(claimsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .sort((left, right) => left.name.localeCompare(right.name))
  for (const entry of entries) {
    const file = 'claims/' + entry.name
    let claim
    try {
      claim = JSON.parse(fs.readFileSync(path.join(claimsDir, entry.name), 'utf8'))
    } catch (error) {
      problem(file, 'invalid JSON (' + String(error && error.message ? error.message : error) + ')')
      continue
    }
    if (claim === null || typeof claim !== 'object' || Array.isArray(claim)) {
      problem(file, 'must be a JSON object')
      continue
    }
    if (typeof claim.marker !== 'string' || !/^[0-9a-z]{4}$/u.test(claim.marker)) {
      problem(file, 'marker must be 4 lowercase letters or digits')
    } else if (entry.name !== claim.marker + '.json') {
      problem(file, 'filename must be ' + claim.marker + '.json')
    }
    if (typeof claim.role !== 'string' || claim.role.trim() === '') problem(file, 'role must be a non-empty string')
    if (claim.state !== 'active' && claim.state !== 'done') problem(file, 'state must be "active" or "done"')
    if (!Array.isArray(claim.scope) || claim.scope.length === 0) {
      problem(file, 'scope must be a non-empty array of repo-relative path prefixes')
    } else {
      for (const item of claim.scope) {
        if (typeof item !== 'string' || item.trim() === '') problem(file, 'scope entries must be non-empty strings')
        else if (/^[/\\]/u.test(item) || item.split(/[/\\]/u).includes('..')) {
          problem(file, 'scope "' + item + '" must be repo-relative and must not contain ".."')
        }
      }
    }
    if (typeof claim.leaseUntil !== 'string' || !ISO.test(claim.leaseUntil) || Number.isNaN(Date.parse(claim.leaseUntil))) {
      problem(file, 'leaseUntil must be an ISO-8601 UTC timestamp (e.g. 2026-11-24T15:00:00Z)')
    }
    claims.push({ file, ...claim })
  }
}

const byMarker = new Map()
for (const claim of claims) {
  if (typeof claim.marker !== 'string') continue
  if (byMarker.has(claim.marker)) problem(claim.file, 'duplicate marker ' + claim.marker + ' (also in ' + byMarker.get(claim.marker) + ')')
  else byMarker.set(claim.marker, claim.file)
}

const active = claims.filter((claim) => claim.state === 'active')
const expired = []
for (const claim of active) {
  if (Number.isNaN(Date.parse(claim.leaseUntil))) continue
  if (Date.parse(claim.leaseUntil) < now) expired.push(claim)
}
for (const claim of expired) warn(claim.marker + ' lease expired at ' + claim.leaseUntil + ' -- anyone may take over and renew it')

const overlaps = []
for (let left = 0; left < active.length; left += 1) {
  for (let right = left + 1; right < active.length; right += 1) {
    const a = active[left]
    const b = active[right]
    const aScope = Array.isArray(a.scope) ? a.scope : []
    const bScope = Array.isArray(b.scope) ? b.scope : []
    for (const rawA of aScope) {
      for (const rawB of bScope) {
        if (typeof rawA !== 'string' || typeof rawB !== 'string') continue
        const one = rawA.replace(/[/\\]+$/u, '')
        const two = rawB.replace(/[/\\]+$/u, '')
        if (one === '' || two === '') continue
        if (one === two || one.startsWith(two + '/') || two.startsWith(one + '/')) {
          overlaps.push({ a: a.marker, b: b.marker, path: one.length <= two.length ? one : two })
        }
      }
    }
  }
}
for (const overlap of overlaps) warn('scope overlap: ' + overlap.a + ' and ' + overlap.b + ' both touch ' + overlap.path)

if (jsonMode) {
  console.log(JSON.stringify({
    generatedAt: new Date(now).toISOString(),
    claims,
    active: active.map((claim) => claim.marker),
    expired: expired.map((claim) => claim.marker),
    overlaps,
    warnings,
    problems,
  }, null, 2))
} else {
  console.log('# claims board')
  console.log('')
  for (const claim of claims) {
    const state = claim.state === 'active' ? (expired.includes(claim) ? 'active (expired)' : 'active') : 'done'
    console.log('- [' + state + '] ' + claim.marker + ' · ' + claim.role + ' · until ' + claim.leaseUntil)
    if (claim.task) console.log('  task : ' + claim.task)
    console.log('  scope: ' + (Array.isArray(claim.scope) ? claim.scope.join(', ') : String(claim.scope)))
  }
  if (claims.length === 0) console.log('(no claims yet)')
  console.log('')
  for (const warning of warnings) console.log('warn: ' + warning)
  for (const issue of problems) console.log('error: ' + issue)
}

const summary = 'board: ' + claims.length + ' claim(s), ' + active.length + ' active, '
  + overlaps.length + ' overlap(s), ' + expired.length + ' expired, ' + problems.length + ' problem(s)'
console.log(summary)

if (problems.length > 0) process.exit(1)
if (checkMode) process.exit(0)
