#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
WORK=/mnt/c/elin-update

cd "$ROOT"
# Before the checkout below, which throws away whatever is in the tree.
"$ROOT/script/depot-export.sh" --check

trap 'rm -rf "$WORK"' EXIT
rm -rf "$WORK"
mkdir -p "$WORK"

git fetch origin
# Everything below is written from the download.
git checkout -qf origin/master
git clean -qfd db

builds=()
for channel in EA nightly; do
  branch=public
  [ "$channel" = nightly ] && branch=nightly

  version="$("$ROOT/script/depot-export.sh" "$WORK/$branch" --branch "$branch")"
  current="$(cat "versions/$channel")"
  [ -n "$current" ] || { echo "update.sh: versions/$channel is empty" >&2; exit 1; }
  echo "update.sh: $branch is $version (was $current)" >&2
  [ "$version" = "$current" ] && continue

  fresh="$WORK/$branch/csv/$version"
  # check-export.ts only warns when it cannot read the baseline, and would
  # otherwise pass an unchecked export straight through.
  [ -d "db/$current" ] || { echo "update.sh: db/$current is missing" >&2; exit 1; }
  npx tsx script/check-export.ts "$fresh" --baseline "db/$current"

  # The other channel may have written this version already, when a nightly is
  # promoted. Both should be the same build, but only the name says so.
  if [ -d "db/$version" ] && ! diff -rq "db/$version" "$fresh" >/dev/null; then
    echo "update.sh: $branch's $version differs from the copy already in db/" >&2
    exit 1
  fi
  rm -rf "db/$version"
  # /mnt/c hands out 0777, and git would record every CSV as executable.
  cp -r --no-preserve=mode "$fresh" "db/$version"
  printf '%s' "$version" > "versions/$channel"

  if [ "$channel" = EA ]; then
    builds+=("$version Stable")
  # Both channels move together when a nightly is promoted, and they name the
  # same version then; only mention it once.
  elif [ ${#builds[@]} -eq 0 ] || [ "$version" != "$(cat versions/EA)" ]; then
    builds+=("$version Nightly")
  else
    builds[0]="$version Stable/Nightly"
  fi
done

if [ ${#builds[@]} -eq 0 ]; then
  echo 'update.sh: neither branch moved; nothing to release' >&2
  exit 1
fi

subject="${builds[0]}"
if [ ${#builds[@]} -gt 1 ]; then
  subject="$subject, ${builds[1]}"
fi

# Elin-Decompiled usually publishes a build the day it ships, but not always,
# and a release that beats it there carries the previous build's modifiers.
feat="$(ruby script/extract_feat.rb 2>&1 >/dev/null </dev/null)" || { echo "$feat" >&2; exit 1; }
body=''
if grep -q 'no decompiled build' <<< "$feat"; then
  body="$(grep 'no decompiled build' <<< "$feat")"
  echo "$body" >&2
fi
ruby script/sync_version.rb
git add .

git commit -m "$subject"
git new-br
git push -u origin "$(git rev-parse --abbrev-ref HEAD)"
gh pr create --title "$subject" --body "$body" --head "$(git rev-parse --abbrev-ref HEAD)"
gh pr merge --auto --merge --delete-branch
