#!/bin/bash
set -euo pipefail

git fetch origin
git checkout origin/master

changed="$(git diff --name-only)"
builds=()

if grep -qx versions/EA <<< "$changed"; then
  builds+=("$(cat versions/EA) Stable")
fi
if grep -qx versions/nightly <<< "$changed"; then
  nightly="$(cat versions/nightly)"
  # Both channels move together when a nightly is promoted, and they name the
  # same version then; only mention it once.
  if [ ${#builds[@]} -eq 0 ] || [ "$nightly" != "$(cat versions/EA)" ]; then
    builds+=("$nightly Nightly")
  else
    builds[0]="$nightly Stable/Nightly"
  fi
fi

if [ ${#builds[@]} -eq 0 ]; then
  echo 'update.sh: no version file changed; nothing to release' >&2
  exit 1
fi

subject="${builds[0]}"
if [ ${#builds[@]} -gt 1 ]; then
  subject="$subject, ${builds[1]}"
fi

ruby script/extract_feat.rb
ruby script/sync_version.rb
git add .

git commit -m "$subject"
git new-br
git push -u origin "$(git rev-parse --abbrev-ref HEAD)"
gh pr create --fill --head "$(git rev-parse --abbrev-ref HEAD)"
gh pr merge --auto --merge --delete-branch
