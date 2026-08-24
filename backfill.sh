#!/bin/bash
# Archives a release that update.sh never saw, because the next one shipped
# before it ran. Its build is no longer what either branch points at, so only
# its manifest id reaches it, and SteamDB is the only place that lists them:
# https://steamdb.info/depot/2135153/manifests/
#
#   usage: backfill.sh <manifest-id> --channel stable|nightly --release-date YYYY-MM-DD [--archive DIR]
#
# This commits and pushes to the archive repository itself; README.md says why,
# and what the checkout it pushes from has to look like.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
ARCHIVE="$ROOT/../elin-chara-viewer-data"
WORK=/mnt/c/elin-backfill

usage() {
  echo 'usage: backfill.sh <manifest-id> --channel stable|nightly --release-date YYYY-MM-DD [--archive DIR]' >&2
  exit 1
}

manifest=''
channel=''
release_date=''
while [ $# -gt 0 ]; do
  case "$1" in
    --channel) channel="${2:-}"; shift 2 || usage ;;
    --release-date) release_date="${2:-}"; shift 2 || usage ;;
    --archive) ARCHIVE="${2:-}"; shift 2 || usage ;;
    -*) usage ;;
    *) [ -z "$manifest" ] || usage; manifest="$1"; shift ;;
  esac
done

[[ "$manifest" =~ ^[0-9]+$ ]] || usage
[ "$channel" = stable ] || [ "$channel" = nightly ] || usage
# archive_release.rb dates a version it is not given a date for as today, which
# for a release that already shipped is never right.
[[ "$release_date" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || usage

[ -f "$ARCHIVE/index.json" ] || { echo "backfill.sh: not an archive checkout: $ARCHIVE" >&2; exit 1; }
ARCHIVE="$(cd "$ARCHIVE" && pwd)"
cd "$ROOT"

command -v ruby >/dev/null || { echo "backfill.sh: ruby is not on PATH" >&2; exit 1; }
[ -d node_modules ] || { echo "backfill.sh: install the dependencies first: npm ci" >&2; exit 1; }
ruby -rdate -e 'Date.iso8601(ARGV[0])' "$release_date" 2>/dev/null || {
  echo "backfill.sh: no such date: $release_date" >&2
  exit 1
}

case "$(git -C "$ARCHIVE" remote get-url origin)" in
  *elin-chara-viewer-data*) ;;
  *) echo "backfill.sh: origin in $ARCHIVE is not the archive repository" >&2; exit 1 ;;
esac
[ "$(git -C "$ARCHIVE" symbolic-ref -q --short HEAD)" = main ] || {
  echo "backfill.sh: $ARCHIVE is not on main" >&2
  exit 1
}
# The commit at the end takes everything in that tree.
[ -z "$(git -C "$ARCHIVE" status --porcelain)" ] || {
  echo "backfill.sh: $ARCHIVE has changes that are not committed" >&2
  exit 1
}
git -C "$ARCHIVE" fetch --quiet origin main
# A commit that never reached origin would ride along with the push at the end.
# It is also what is left behind when that push fails, and saying so here is
# what stops the next run from finding its own work archived and reporting
# nothing to do.
[ "$(git -C "$ARCHIVE" rev-list --count FETCH_HEAD..HEAD)" = 0 ] || {
  echo "backfill.sh: $ARCHIVE has commits that are not pushed" >&2
  exit 1
}
"$ROOT/script/depot-export.sh" --check

cleanup() {
  local status=$?

  if [ "$status" = 0 ]; then
    rm -rf "$WORK"
    return
  fi

  if [ -d "$WORK" ]; then
    echo "backfill.sh: $WORK is kept; the next run deletes it" >&2
  fi
  if [ -n "$(git -C "$ARCHIVE" status --porcelain)" ]; then
    echo "backfill.sh: $ARCHIVE was left written to; undo it with" >&2
    echo "  git -C '$ARCHIVE' checkout . && git -C '$ARCHIVE' clean -fd" >&2
  fi
}
trap cleanup EXIT
rm -rf "$WORK"
mkdir -p "$WORK"

version="$("$ROOT/script/depot-export.sh" "$WORK" --manifest "$manifest")"
echo "backfill.sh: manifest $manifest is $version" >&2
fresh="$WORK/csv/$version"

for file in versions/EA versions/nightly; do
  [ "$(cat "$file")" != "$version" ] || {
    echo "backfill.sh: $version is what $file names; a release archives it" >&2
    exit 1
  }
done

# The release flow may have archived this very version while the build was
# downloading, and the checks that follow -- for an archived copy, and for the
# version below it -- read that tree. Nothing has written to it yet, so this
# fast-forwards.
git -C "$ARCHIVE" pull --quiet --ff-only origin main

slug="$(ruby -r./script/archive_repo -e 'puts ArchiveRepo.slugify(ARGV[0])' "$version")"
if [ -d "$ARCHIVE/v/$slug/csv" ]; then
  diff -rq "$ARCHIVE/v/$slug/csv" "$fresh" >/dev/null || {
    echo "backfill.sh: $version is archived already, and this build exports different CSVs" >&2
    exit 1
  }
  echo "backfill.sh: $version is archived already; nothing to do" >&2
  exit 0
fi

previous="$(ruby -r./script/archive_repo -e 'puts ArchiveRepo.previous_slug(*ARGV)' "$ARCHIVE" "$version")"
baseline="$ARCHIVE/v/$previous/csv"
# check-export.ts only warns when it cannot read the baseline, and would
# otherwise pass an unchecked export straight through. It also reports the
# game's own schema changes as export damage when the baseline is a long way
# off, and db/ holds the current builds only.
[ -n "$previous" ] && [ -d "$baseline" ] || {
  echo "backfill.sh: no archived version below $version to check the export against" >&2
  exit 1
}
echo "backfill.sh: checking $version against $baseline" >&2
npx tsx script/check-export.ts "$fresh" --baseline "$baseline"

ruby script/archive_release.rb "$ARCHIVE" "$version" \
  --channel "$channel" --release-date "$release_date" --db "$WORK/csv"
ruby script/extract_feat.rb --archive "$ARCHIVE" --version "$version"
npm run check:archive -- "$ARCHIVE"
# Before the commit below, so that one release is one push: sync-r2 keeps a
# single pending run per group, and a third push would drop the second one's
# range on the floor until the weekly full sync. The history is rebuilt from
# every archived version, so one that arrives out of order needs nothing else
# done.
history=0
npm run build:history -- "$ARCHIVE" || history=$?

git -C "$ARCHIVE" add -A
git -C "$ARCHIVE" commit -m "Archive $version"
git -C "$ARCHIVE" push origin HEAD:main || {
  rm -rf "$WORK"
  echo "backfill.sh: the push was refused; origin/main has moved since the pull above." >&2
  echo "The commit is still there. Catch up on what moved:" >&2
  echo "  git -C '$ARCHIVE' fetch origin main" >&2
  echo "then rebase the commit onto origin/main, run" >&2
  echo "  npm run build:history -- '$ARCHIVE'" >&2
  echo "again over the rebased tree, amend the commit and push it. If origin/main" >&2
  echo "archived $version itself in the meantime, drop the commit instead:" >&2
  echo "  git -C '$ARCHIVE' reset --hard origin/main" >&2
  exit 1
}

# archive.yml commits a version whose history build failed rather than losing
# it with the run; the same reasoning holds here, because what stops the build
# is a column nobody has classified yet and the version has no part in it.
[ "$history" = 0 ] || {
  rm -rf "$WORK"
  echo "backfill.sh: $version is archived, but the history was not rebuilt." >&2
  echo "Classify the column the build stopped at, then run" >&2
  echo "  npm run build:history -- '$ARCHIVE'" >&2
  echo "again, then commit the result and push it." >&2
  exit 1
}
