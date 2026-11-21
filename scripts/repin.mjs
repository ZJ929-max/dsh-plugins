#!/usr/bin/env node
// Recompute index.json pins (and the commit hash quoted in each patch header)
// from the plugin repositories' default branches.
//
// Two-track policy (DESIGN-NOTES §4): package.json floats to each plugin's main,
// index.json pins a 40-hex commit. This script makes the index track main; the
// caller decides whether to commit the result.
//
// Zero runtime dependencies: node:child_process + node:fs only. Anonymous reads.
//
// usage: node scripts/repin.mjs [--dry-run]
//   --dry-run   print what would change, write nothing
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const dryRun = process.argv.includes('--dry-run')
const DEP = /^github:([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)(?:#([0-9a-f]{40}))?$/u

const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'))
const git = (args, cwd) => execFileSync('git', args, {
  cwd,
  encoding: 'utf8',
  timeout: 120000,
  env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
}).trim()

const pkg = readJson('package.json')
const index = readJson('index.json')
const patchFiles = (pkg.dsh?.bundle?.patch ?? []).filter((file) => typeof file === 'string')

/** Resolve one dependency to its default branch head, commit time and version. */
function probe(repoUrl) {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'repin-'))
  try {
    git(['init', '--quiet'], work)
    git(['remote', 'add', 'origin', repoUrl], work)
    const symref = git(['ls-remote', '--symref', 'origin', 'HEAD'], work)
    const ref = /^ref:\s+refs\/heads\/(\S+)\s+HEAD$/mu.exec(symref)
    const branch = ref ? ref[1] : 'main'
    git(['fetch', '--quiet', '--depth', '1', 'origin', `refs/heads/${branch}`], work)
    const commit = git(['rev-parse', 'FETCH_HEAD'], work)
    const committedAt = Number(git(['show', '-s', '--format=%ct', 'FETCH_HEAD'], work))
    let version = null
    try {
      version = JSON.parse(git(['show', 'FETCH_HEAD:package.json'], work)).version ?? null
    } catch {
      version = null
    }
    return { branch, commit, committedAt, version }
  } finally {
    // Windows can keep a handle on the fetched repository for a moment; a
    // leftover temp directory is harmless, a crashed run is not.
    try {
      fs.rmSync(work, { recursive: true, force: true })
    } catch {
      // ignore
    }
  }
}

const changes = []
for (const plugin of index.plugins ?? []) {
  const entry = pkg.dependencies?.[plugin.name]
  const match = typeof entry === 'string' ? DEP.exec(entry) : null
  if (match === null) {
    const repo = plugin.repository?.url
    console.log(`skip ${plugin.name}: not a pack dependency${repo ? ` (${repo})` : ''}`)
    continue
  }
  const [, owner, repo] = match
  const probeResult = probe(`https://github.com/${owner}/${repo}.git`)
  const latest = (plugin.versions ?? [])[0]
  if (latest === undefined) {
    console.log(`skip ${plugin.name}: index entry has no versions[]`)
    continue
  }
  const before = {
    version: latest.version,
    commit: latest.source?.commit,
    timestamp: latest.publishTimestamp,
  }
  const after = {
    version: probeResult.version ?? latest.version,
    commit: probeResult.commit,
    timestamp: probeResult.committedAt,
  }
  // Identity is (commit, version). publishTimestamp is derived from the commit
  // time only when the pin actually moves; comparing it directly would rewrite
  // entries that merely stored a different (but equally valid) publication time.
  const changed = before.commit !== after.commit || before.version !== after.version
  console.log(`${changed ? 'update' : 'ok    '} ${plugin.name}: ${String(before.commit).slice(0, 8)}@${before.version} -> ${after.commit.slice(0, 8)}@${after.version} (branch ${probeResult.branch})`)
  if (!changed) continue
  changes.push({ name: plugin.name, owner, repo, latest, before, after })
  if (!dryRun) {
    latest.version = after.version
    latest.publishTimestamp = after.timestamp
    latest.source = { ...(latest.source ?? {}), type: 'git', commit: after.commit }
    latest.source.url = `https://github.com/${owner}/${repo}`
  }
}

// Patch headers quote the commit they were copied from; keep them truthful.
let headerEdits = 0
for (const file of patchFiles) {
  const absolute = path.join(root, file)
  if (!fs.existsSync(absolute)) continue
  const text = fs.readFileSync(absolute, 'utf8')
  const owner = /github\.com\/([^/\s]+)\/([^/\s]+)\/blob\/[0-9a-f]{40}\/cordis\.patch\.yml/u.exec(text)
  if (owner === null) continue
  const updated = changes.find((change) => change.repo === owner[2] && change.owner === owner[1])
  if (updated === undefined) continue
  const rewritten = text.replace(
    /(github\.com\/[^/\s]+\/[^/\s]+\/blob\/)[0-9a-f]{40}(\/cordis\.patch\.yml)/gu,
    `$1${updated.after.commit}$2`,
  )
  if (rewritten === text) continue
  headerEdits += 1
  console.log(`update ${file}: header -> ${updated.after.commit.slice(0, 8)}`)
  if (!dryRun) fs.writeFileSync(absolute, rewritten, 'utf8')
}

if (!dryRun && changes.length > 0) {
  fs.writeFileSync(path.join(root, 'index.json'), `${JSON.stringify(index, null, 2)}\n`, 'utf8')
}

if (changes.length === 0 && headerEdits === 0) {
  console.log('repin: no changes')
} else {
  console.log(`repin: ${changes.length} index entr${changes.length === 1 ? 'y' : 'ies'}, ${headerEdits} patch header${headerEdits === 1 ? '' : 's'}${dryRun ? ' (dry run)' : ''}`)
}
