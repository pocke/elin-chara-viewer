#!/bin/bash
set -euo pipefail

DD="${DD:-/mnt/c/Users/kuwab/AppData/Local/Microsoft/WinGet/Packages/SteamRE.DepotDownloader_Microsoft.Winget.Source_8wekyb3d8bbwe/DepotDownloader.exe}"
MOD="${MOD:-/mnt/c/Program Files (x86)/Steam/steamapps/common/Elin/Package/Mod_ElinMiscMod}"
STEAM_USER="${STEAM_USER:-p_ck_}"
ROOT="$(cd "$(dirname "$0")" && pwd)"
WORK=/mnt/c/elin-update

cd "$ROOT"
[ -x "$DD" ] || { echo "update.sh: DepotDownloader not found: $DD" >&2; exit 1; }
[ -f "$MOD/ElinMiscMod.dll" ] || { echo "update.sh: mod not found: $MOD/ElinMiscMod.dll" >&2; exit 1; }
# Before the checkout below, which leaves a detached HEAD behind when a later
# step fails.
docker compose version >/dev/null 2>&1 || { echo 'update.sh: docker compose is not available' >&2; exit 1; }

trap 'rm -rf "$WORK"' EXIT
rm -rf "$WORK"
mkdir -p "$WORK"

git fetch origin
# Everything below is written from the download.
git checkout -qf origin/master
git clean -qfd db

# The checkout above may have moved the lockfile or the Dockerfile, and
# node_modules lives in a volume that nothing else updates.
docker compose run --build --rm -T check npm ci --ignore-scripts >&2

# Exports taken from a copy without these are byte-identical to exports from
# the complete build.
cat > "$WORK/filelist.txt" <<'EOF'
regex:^(?!.*(\.resS$|\.resource$|_Elona[\\/]Texture[\\/]|_Elona[\\/]Etc[\\/]Gallery[\\/]|_Elona[\\/]Portrait[\\/])).*$
EOF

# A build does not say which version it is until it runs.
export_branch() {
  local branch="$1"
  local build="$WORK/$branch" exported="$WORK/$branch-csv"
  local build_win export_win
  build_win="$(wslpath -w "$build")"
  export_win="$(wslpath -w "$exported")"

  "$DD" -app 2135150 -depot 2135153 -branch "$branch" \
    -username "$STEAM_USER" -remember-password -filelist "$(wslpath -w "$WORK/filelist.txt")" \
    -dir "$build_win" </dev/null >&2

  mkdir -p "$build/Package/Mod_ElinMiscMod"
  cp "$MOD/ElinMiscMod.dll" "$MOD/package.xml" "$build/Package/Mod_ElinMiscMod/"
  # Neither file ships in the depot. Without steam_appid.txt the Steam client
  # starts and launches the installed copy alongside this one.
  printf '2135150' > "$build/steam_appid.txt"
  printf '%s\\Package\\Mod_ElinMiscMod,1\r\n' "$build_win" > "$build/loadorder.txt"

  "$ROOT/script/export-build.sh" "$build_win" "$export_win" </dev/null >&2

  local dirs=()
  mapfile -t dirs < <(find "$exported" -maxdepth 1 -mindepth 1 -type d | sort)
  [ "${#dirs[@]}" -eq 1 ] || {
    echo "expected one version in $exported, got: ${dirs[*]:-nothing}" >&2
    return 1
  }
  basename "${dirs[0]}"
}

builds=()
for channel in EA nightly; do
  branch=public
  [ "$channel" = nightly ] && branch=nightly

  version="$(export_branch "$branch")"
  current="$(cat "versions/$channel")"
  [ -n "$current" ] || { echo "update.sh: versions/$channel is empty" >&2; exit 1; }
  echo "update.sh: $branch is $version (was $current)" >&2
  [ "$version" = "$current" ] && continue

  fresh="$WORK/$branch-csv/$version"
  # check-export.ts only warns when it cannot read the baseline, and would
  # otherwise pass an unchecked export straight through.
  [ -d "db/$current" ] || { echo "update.sh: db/$current is missing" >&2; exit 1; }
  # npm run, not npx: npx fetches tsx from the network when it is missing.
  docker compose run --rm -T -v "$fresh:/fresh:ro" check \
    npm run check:export -- /fresh --baseline "db/$current"

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

# The container mounts this repository read-write, and the commit below is
# merged and deployed without anyone reading it. -z because every db/ path
# holds spaces, which the default output quotes.
git status --porcelain -z --no-renames > "$WORK/status"
unexpected=()
while IFS= read -r -d '' entry; do
  case "${entry:3}" in
    db/* | versions/* | src/generated/featModifier.ea.json | \
      src/generated/featModifier.nightly.json | src/lib/bundledData.ts | next.config.ts) ;;
    *) unexpected+=("${entry:3}") ;;
  esac
done < "$WORK/status"
[ ${#unexpected[@]} -eq 0 ] || {
  echo 'update.sh: changes outside the files this script writes:' >&2
  printf '%s\n' "${unexpected[@]}" >&2
  exit 1
}

git add .

git commit -m "$subject"
git new-br
git push -u origin "$(git rev-parse --abbrev-ref HEAD)"
gh pr create --title "$subject" --body "$body" --head "$(git rev-parse --abbrev-ref HEAD)"
gh pr merge --auto --merge --delete-branch
