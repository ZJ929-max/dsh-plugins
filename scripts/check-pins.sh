#!/usr/bin/env bash
# Verify that every index pin is a real, reachable commit of its repository and is
# an ancestor of that repository's default branch.
#
# Two-track policy (see DESIGN-NOTES.md §4): package.json may float a dependency
# (`github:owner/repo`, no pin) while index.json pins a 40-hex commit. The index is
# allowed to lag the branch head — it must never point at history the branch does
# not contain. That is the property this script checks.
#
# Anonymous access only: no token, no secret, no credential prompt.
#
# usage: bash scripts/check-pins.sh
#   CHECK_PINS_TRANSPORT=ssh   # local runs where GitHub HTTPS is blocked
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

transport="${CHECK_PINS_TRANSPORT:-https}"
case "$transport" in
  https) url_of() { printf 'https://github.com/%s.git' "$1"; } ;;
  ssh)   url_of() { printf 'git@github.com:%s.git' "$1"; } ;;
  *) echo "check-pins: unknown CHECK_PINS_TRANSPORT=$transport (expected https or ssh)" >&2; exit 2 ;;
esac

node - "$root" > "$work/pairs.tsv" <<'NODE'
const fs = require("node:fs");
const path = require("node:path");
const root = process.argv[2];
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const index = JSON.parse(fs.readFileSync(path.join(root, "index.json"), "utf8"));
const DEP = /^github:([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)(?:#([0-9a-f]{40}))?$/u;
const byName = new Map((index.plugins ?? []).map((plugin) => [plugin.name, plugin]));
let bad = 0;
for (const [name, spec] of Object.entries(pkg.dependencies ?? {})) {
  const match = DEP.exec(spec);
  if (match === null) {
    console.error(`::error::check-pins: ${name} has an unsupported dependency spec ${spec}`);
    bad += 1;
    continue;
  }
  const [, owner, repo, depCommit] = match;
  const plugin = byName.get(name);
  if (plugin === undefined) {
    console.error(`::error::check-pins: ${name} is a dependency but has no index.json entry`);
    bad += 1;
    continue;
  }
  const latest = (plugin.versions ?? [])[0] ?? {};
  const pin = latest.source === undefined ? "" : String(latest.source.commit ?? "");
  if (!/^[0-9a-f]{40}$/u.test(pin)) {
    console.error(`::error::check-pins: ${name} index pin is not a 40-hex commit (${pin})`);
    bad += 1;
    continue;
  }
  if (depCommit !== undefined && depCommit !== pin) {
    console.error(`::error::check-pins: ${name} dependency pin ${depCommit} differs from index pin ${pin}`);
    bad += 1;
    continue;
  }
  console.log([name, `${owner}/${repo}`, pin, String(latest.version ?? "?")].join("\t"));
}
for (const name of byName.keys()) {
  if (!Object.hasOwn(pkg.dependencies ?? {}, name)) {
    console.error(`::warning::check-pins: index entry ${name} is not a pack dependency (retired or index-only)`);
  }
}
process.exit(bad === 0 ? 0 : 1);
NODE

count=0
drift=0
while IFS=$'\t' read -r name repo pin version; do
  count=$((count + 1))
  dir="$work/repo-$count"
  mkdir -p "$dir"
  git -C "$dir" init -q
  git -C "$dir" remote add origin "$(url_of "$repo")"
  if ! git -C "$dir" fetch -q --filter=blob:none origin \
      '+refs/heads/*:refs/remotes/origin/*' '+refs/tags/*:refs/tags/*'; then
    echo "::error::check-pins: cannot fetch $(url_of "$repo") (repository missing or not public)" >&2
    exit 1
  fi
  if ! git -C "$dir" cat-file -e "${pin}^{commit}" 2>/dev/null; then
    echo "::error::check-pins: $name: commit $pin is not reachable in $repo" >&2
    exit 1
  fi
  branch="$(git -C "$dir" ls-remote --symref origin HEAD | awk '/^ref:/{print $2; exit}')"
  branch="${branch#refs/heads/}"
  if [ -z "$branch" ] || ! git -C "$dir" rev-parse --verify -q "refs/remotes/origin/$branch" >/dev/null; then
    echo "::error::check-pins: $name: cannot resolve the default branch of $repo" >&2
    exit 1
  fi
  if ! git -C "$dir" merge-base --is-ancestor "$pin" "refs/remotes/origin/$branch"; then
    echo "::error::check-pins: $name: index pin ${pin:0:8} is not an ancestor of $repo@$branch" >&2
    exit 1
  fi
  behind="$(git -C "$dir" rev-list --count "$pin..refs/remotes/origin/$branch")"
  head="$(git -C "$dir" rev-parse --short=8 "refs/remotes/origin/$branch")"
  if [ "$behind" -gt 0 ]; then
    if [ "${CHECK_PINS_STRICT:-0}" = "1" ]; then
      echo "::error::check-pins: $name: index pin ${pin:0:8} is $behind commit(s) behind $repo@$branch ($head) and CHECK_PINS_STRICT=1" >&2
      drift=$((drift + 1))
    else
      echo "::warning::check-pins: $name: index pin ${pin:0:8} is $behind commit(s) behind $repo@$branch ($head)"
    fi
  fi
  echo "ok $name $repo@$branch pin=${pin:0:8} head=$head behind=$behind version=$version"
done < "$work/pairs.tsv"

echo "check-pins: OK — $count pins are reachable and sit on their default branch"
if [ "${CHECK_PINS_STRICT:-0}" = "1" ] && [ "${drift:-0}" -gt 0 ]; then
  echo "check-pins: $drift pin(s) are behind their repository head" >&2
  exit 1
fi
