#!/usr/bin/env bash
# Verify that every github: dependency pin is a commit reachable from a public
# ref. Anonymous HTTPS only: no token, no secret, no credential prompt.
set -euo pipefail

root="$(cd "$(dirname "$BASH_SOURCE")/.." && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

node -e '
const fs = require("node:fs");
const pkg = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
for (const [name, spec] of Object.entries(pkg.dependencies ?? {})) {
  const m = /^github:([^#]+)#([0-9a-f]{40})$/.exec(spec);
  if (!m) {
    console.error("check-pins: " + name + " is not a 40-hex github pin: " + spec);
    process.exit(1);
  }
  console.log([name, m[1], m[2]].join("\t"));
}
' "$root/package.json" > "$work/pins.tsv"

count=0
while IFS=$'\t' read -r name repo commit; do
  count=$((count + 1))
  dir="$work/repo-$count"
  mkdir -p "$dir"
  git -C "$dir" init -q
  git -C "$dir" remote add origin "https://github.com/$repo.git"
  if ! git -C "$dir" fetch -q --filter=blob:none origin '+refs/heads/*:refs/remotes/origin/*' '+refs/tags/*:refs/tags/*'; then
    echo "::error::check-pins: cannot fetch https://github.com/$repo (repository missing or not public)" >&2
    exit 1
  fi
  if ! git -C "$dir" cat-file -e "$commit^{commit}" 2>/dev/null; then
    echo "::error::check-pins: $name: commit $commit is not reachable in https://github.com/$repo" >&2
    exit 1
  fi
  echo "ok $name $repo@$commit"
done < "$work/pins.tsv"

echo "check-pins: OK — $count pins reachable"
