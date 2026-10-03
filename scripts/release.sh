#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

fail() {
  echo "release: $*" >&2
  exit 1
}

wait_run() {
  local workflow=$1 sha=$2 id=""
  for _ in $(seq 60); do
    id=$(gh run list --workflow "$workflow" --commit "$sha" --json databaseId -q '.[0].databaseId')
    [ -n "$id" ] && break
    sleep 5
  done
  [ -n "$id" ] || fail "$workflow did not start for $sha"
  gh run watch "$id" --exit-status >/dev/null || fail "$workflow failed: $(gh run view "$id" --json url -q .url)"
}

unpublished() {
  local pkg name version
  for pkg in packages/*/package.json; do
    name=$(node -p "require('./$pkg').name")
    version=$(node -p "require('./$pkg').version")
    [ -n "$(npm view "$name@$version" version 2>/dev/null)" ] || echo "$name@$version"
  done
}

smoke() {
  local dir entry
  dir=$(mktemp -d)
  pnpm -r --filter='./packages/*' pack --pack-destination "$dir" >/dev/null
  (
    cd "$dir"
    npm init -y >/dev/null
    npm install --no-audit --no-fund ./*.tgz react@19 react-dom@19 >/dev/null
    for entry in mnx mnx/edit mnx-score notation-fonts notation-engine notation-react; do
      node --input-type=module -e "await import('@polyhymnia/$entry')" || fail "packed @polyhymnia/$entry does not import"
    done
  )
  rm -rf "$dir"
}

[ "$(git branch --show-current)" = development ] || fail "not on development"
[ -z "$(git status --porcelain)" ] || fail "working tree not clean"
git fetch origin
git merge --ff-only origin/development
git merge-base --is-ancestor origin/master HEAD || fail "origin/master is not an ancestor of development"

pnpm install --frozen-lockfile
pnpm build
pnpm typecheck
pnpm test -- --reporter=dot
pnpm --filter @polyhymnia/web typecheck
pnpm --filter @polyhymnia/web test -- --reporter=dot
pnpm --filter @polyhymnia/web build

if find .changeset -name '*.md' ! -name README.md | grep -q .; then
  pnpm changeset version
  pnpm install
  git add -A
  git commit -m "Version packages"
fi

pending=$(unpublished)
[ -n "$pending" ] || fail "nothing to release: no pending changesets and every version is on npm"

pnpm build
smoke

sha=$(git rev-parse HEAD)
git push origin development
wait_run ci.yml "$sha"
git push origin development:master
wait_run release.yml "$sha"

for _ in $(seq 24); do
  [ -z "$(unpublished)" ] && break
  sleep 5
done
[ -z "$(unpublished)" ] || fail "not on npm after release.yml: $(unpublished | tr '\n' ' ')"

echo "released:"
echo "$pending"
