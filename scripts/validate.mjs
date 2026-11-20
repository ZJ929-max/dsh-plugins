#!/usr/bin/env node
// Zero-dependency checks for this repository. The authoritative index parser
// (@deepseek-ai/dsh-plugin-market-index) is not available in CI, so this file
// re-implements the rules this repository relies on; DESIGN-NOTES.md records
// where it was compared with the real parser.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const problems = [];
const fail = (message) => problems.push(message);
const textOf = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const jsonOf = (relative) => JSON.parse(textOf(relative));

const GIT_PIN = /^github:([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)#([0-9a-f]{40})$/u;
const PACKAGE_NAME = /^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/u;
const SEMVER = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/u;
const COMMIT = /^[0-9a-f]{40}$/u;
const RETIRED_INDEX_ONLY = new Set(["dsh-tokeneconomizer"]);

function localizedEn(value) {
  if (typeof value === "string") return value.trim() !== "";
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && typeof value.en === "string" && value.en.trim() !== "";
}

function compareSemver(left, right) {
  const a = left.split("-")[0].split(".").map(Number);
  const b = right.split("-")[0].split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
}

// --- package.json -----------------------------------------------------------
const pkg = jsonOf("package.json");
if (pkg.license !== "MPL-2.0") fail("package.json: license must be MPL-2.0");
if (pkg.private === true) fail("package.json: a bundle others install must not be private");
if (pkg.dsh === undefined || pkg.dsh.bundle === undefined) fail("package.json: dsh.bundle is missing");
const patchList = pkg.dsh === undefined || pkg.dsh.bundle === undefined ? undefined : pkg.dsh.bundle.patch;
if (!Array.isArray(patchList) || patchList.length === 0) fail("package.json: dsh.bundle.patch must be a non-empty array");
if (!Array.isArray(pkg.files) || !pkg.files.includes("patches")) fail("package.json: files must include \"patches\"");
if (!fs.existsSync(path.join(root, "LICENSE"))) fail("LICENSE is missing");

// --- dependencies are 40-hex git pins --------------------------------------
const deps = pkg.dependencies === undefined ? {} : pkg.dependencies;
const depPins = new Map();
for (const [name, spec] of Object.entries(deps)) {
  const match = GIT_PIN.exec(spec);
  if (match === null) {
    fail("package.json: dependency " + name + " must be github:owner/repo#<40 lowercase hex> (got " + spec + ")");
    continue;
  }
  depPins.set(name, { repo: match[1] + "/" + match[2], commit: match[3] });
}
if (depPins.size === 0) fail("package.json: no pinned dependencies");

// --- patches ---------------------------------------------------------------
const patchIds = new Set();
const patchedNames = new Set();
for (const file of patchList === undefined ? [] : patchList) {
  if (typeof file !== "string" || !file.startsWith("./patches/") || !file.endsWith(".yml")) {
    fail("package.json: patch " + String(file) + " must be a ./patches/*.yml path");
    continue;
  }
  if (!fs.existsSync(path.join(root, file))) {
    fail(file + ": file does not exist");
    continue;
  }
  const text = textOf(file);
  if (!/^- insert:\s*$/mu.test(text)) fail(file + ": must contain a top-level \"- insert:\" block");
  const idMatch = /^\s*-\s+id:\s*(\S+)\s*$/mu.exec(text);
  const nameMatch = /^\s+name:\s*['"]?([^'"\s]+)['"]?\s*$/mu.exec(text);
  if (idMatch === null) { fail(file + ": missing \"- id:\""); continue; }
  if (nameMatch === null) { fail(file + ": missing \"name:\""); continue; }
  const id = idMatch[1];
  const name = nameMatch[1];
  if (patchIds.has(id)) fail(file + ": duplicate insert id " + id);
  patchIds.add(id);
  if (!depPins.has(name)) fail(file + ": name " + name + " is not a dependency of this package");
  if (patchedNames.has(name)) fail(file + ": dependency " + name + " is patched twice");
  patchedNames.add(name);
  const pin = depPins.get(name);
  const header = /github\.com\/[^/\s]+\/[^/\s]+\/blob\/([0-9a-f]{40})\/cordis\.patch\.yml/u.exec(text);
  if (header === null) fail(file + ": header must link cordis.patch.yml at a 40-hex commit");
  else if (pin !== undefined && header[1] !== pin.commit) fail(file + ": header commit " + header[1] + " differs from dependency pin " + pin.commit);
}
for (const name of depPins.keys()) {
  if (!patchedNames.has(name)) fail("dependency " + name + " has no insert patch");
}
if (Array.isArray(patchList) && patchList.length !== depPins.size) {
  fail("package.json: " + String(patchList.length) + " patch files for " + String(depPins.size) + " dependencies");
}

// --- index.json ------------------------------------------------------------
const index = jsonOf("index.json");
if (index.format !== 1) fail("index.json: $.format must be 1");
if (!localizedEn(index.title)) fail("index.json: $.title must be a LocalizedText containing en");
if (!Array.isArray(index.plugins) || index.plugins.length === 0) fail("index.json: $.plugins must be a non-empty array");
const indexPlugins = new Map();
for (const [position, plugin] of (Array.isArray(index.plugins) ? index.plugins : []).entries()) {
  const at = "index.json: $.plugins[" + String(position) + "]";
  if (plugin === null || typeof plugin !== "object" || Array.isArray(plugin)) { fail(at + " must be an object"); continue; }
  if (typeof plugin.name !== "string" || !PACKAGE_NAME.test(plugin.name) || plugin.name.length > 214) {
    fail(at + ".name must be a valid npm package name");
    continue;
  }
  if (indexPlugins.has(plugin.name)) fail(at + ".name duplicates " + plugin.name);
  indexPlugins.set(plugin.name, plugin);
  if (plugin.title !== undefined && !localizedEn(plugin.title)) fail(at + ".title must contain en");
  if (plugin.description !== undefined && !localizedEn(plugin.description)) fail(at + ".description must contain en");
  if (!Array.isArray(plugin.versions) || plugin.versions.length === 0) {
    fail(at + ".versions must be a non-empty array");
    continue;
  }
  const seen = new Set();
  for (const [versionAt, version] of plugin.versions.entries()) {
    const base = at + ".versions[" + String(versionAt) + "]";
    if (version === null || typeof version !== "object" || Array.isArray(version)) { fail(base + " must be an object"); continue; }
    if (typeof version.version !== "string" || !SEMVER.test(version.version)) fail(base + ".version must be an exact SemVer");
    if (seen.has(version.version)) fail(base + ".version duplicates " + String(version.version));
    seen.add(version.version);
    if (!Number.isInteger(version.publishTimestamp) || version.publishTimestamp < 0 || version.publishTimestamp >= 1e11) {
      fail(base + ".publishTimestamp must be an integer Unix second in [0, 1e11)");
    }
    const source = version.source;
    if (source === null || typeof source !== "object" || Array.isArray(source) || source.type !== "git") {
      fail(base + ".source.type must be \"git\"");
      continue;
    }
    if (typeof source.commit !== "string" || !COMMIT.test(source.commit)) fail(base + ".source.commit must be a lowercase 40-hex SHA");
    if (typeof source.url !== "string") { fail(base + ".source.url must be a string"); continue; }
    let url;
    try { url = new URL(source.url); } catch (error) { fail(base + ".source.url must be an absolute URL"); continue; }
    if (source.url !== url.href || url.protocol !== "https:") fail(base + ".source.url must be a canonical https URL");
    if (url.pathname.split("/").filter((part) => part !== "").length < 2) fail(base + ".source.url must name a repository with at least two path segments");
    if (/\.(?:tgz|tar\.gz)$/iu.test(url.pathname)) fail(base + ".source.url must not name a tarball");
  }
  for (let position2 = 1; position2 < plugin.versions.length; position2 += 1) {
    if (compareSemver(plugin.versions[position2 - 1].version, plugin.versions[position2].version) <= 0) {
      fail(at + ".versions must be in descending SemVer order");
      break;
    }
  }
}

// --- index and dependencies agree -----------------------------------------
for (const [name, pin] of depPins) {
  const plugin = indexPlugins.get(name);
  if (plugin === undefined) { fail("index.json: dependency " + name + " has no index entry"); continue; }
  const latest = Array.isArray(plugin.versions) && plugin.versions.length > 0 ? plugin.versions[0] : undefined;
  if (latest === undefined) continue;
  const source = latest.source === undefined ? {} : latest.source;
  if (source.commit !== pin.commit) fail("index.json: " + name + " commit " + String(source.commit) + " differs from dependency pin " + pin.commit);
  const expectedUrl = "https://github.com/" + pin.repo;
  if (source.url !== expectedUrl) fail("index.json: " + name + " source url " + String(source.url) + " differs from " + expectedUrl);
}
for (const name of indexPlugins.keys()) {
  if (!depPins.has(name) && !RETIRED_INDEX_ONLY.has(name)) fail("index.json: " + name + " is neither a dependency nor an index-only retired plugin");
}
for (const name of RETIRED_INDEX_ONLY) {
  if (!indexPlugins.has(name)) fail("index.json: missing index-only plugin " + name);
}

if (problems.length > 0) {
  console.error("validate: " + String(problems.length) + " problem(s)");
  for (const problem of problems) console.error(" - " + problem);
  process.exit(1);
}
console.log("validate: OK — " + String(patchList.length) + " patches, " + String(depPins.size) + " pinned dependencies, " + String(indexPlugins.size) + " index plugins");
