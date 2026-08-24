#!/bin/bash
# Downloads one build of the Elin depot, drops the exporter mod into it and
# runs it. Prints the version the build names itself; the CSVs land in
# <work-dir>/csv/<version>.
#
#   usage: depot-export.sh <work-dir> --branch <name>|--manifest <id>
#          depot-export.sh --check
#
# <work-dir> has to be somewhere Windows can reach, because export-build.sh
# runs the build as a Windows process.
#
# --check only looks for DepotDownloader and the mod, so that a caller can fail
# before it does anything it would have to undo.
set -euo pipefail

DD="${DD:-/mnt/c/Users/kuwab/AppData/Local/Microsoft/WinGet/Packages/SteamRE.DepotDownloader_Microsoft.Winget.Source_8wekyb3d8bbwe/DepotDownloader.exe}"
MOD="${MOD:-/mnt/c/Program Files (x86)/Steam/steamapps/common/Elin/Package/Mod_ElinMiscMod}"
STEAM_USER="${STEAM_USER:-p_ck_}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

usage() {
  echo 'usage: depot-export.sh <work-dir> --branch <name>|--manifest <id>' >&2
  echo '       depot-export.sh --check' >&2
  exit 1
}

check_tools() {
  [ -x "$DD" ] || { echo "depot-export.sh: DepotDownloader not found: $DD" >&2; exit 1; }
  [ -f "$MOD/ElinMiscMod.dll" ] || { echo "depot-export.sh: mod not found: $MOD/ElinMiscMod.dll" >&2; exit 1; }
}

[ "${1:-}" = --check ] && { [ "$#" -eq 1 ] || usage; check_tools; exit 0; }

work=''
depot=()
while [ $# -gt 0 ]; do
  case "$1" in
    --branch)
      [ "${#depot[@]}" -eq 0 ] || usage
      [[ "${2:-}" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || usage
      depot=(-branch "$2")
      shift 2 ;;
    --manifest)
      [ "${#depot[@]}" -eq 0 ] || usage
      [[ "${2:-}" =~ ^[0-9]+$ ]] || usage
      # A past manifest is refused on the public branch.
      depot=(-manifest "$2" -branch nightly)
      shift 2 ;;
    -*) usage ;;
    *) [ -z "$work" ] || usage; work="$1"; shift ;;
  esac
done
[ -n "$work" ] || usage
[ "${#depot[@]}" -gt 0 ] || usage

check_tools

build="$work/build"
exported="$work/csv"
mkdir -p "$build" "$exported"
build_win="$(wslpath -w "$build")"
export_win="$(wslpath -w "$exported")"

# Exports taken from a copy without these are byte-identical to exports from
# the complete build.
cat > "$work/filelist.txt" <<'EOF'
regex:^(?!.*(\.resS$|\.resource$|_Elona[\\/]Texture[\\/]|_Elona[\\/]Etc[\\/]Gallery[\\/]|_Elona[\\/]Portrait[\\/])).*$
EOF

"$DD" -app 2135150 -depot 2135153 "${depot[@]}" \
  -username "$STEAM_USER" -remember-password -filelist "$(wslpath -w "$work/filelist.txt")" \
  -dir "$build_win" </dev/null >&2

mkdir -p "$build/Package/Mod_ElinMiscMod"
cp "$MOD/ElinMiscMod.dll" "$MOD/package.xml" "$build/Package/Mod_ElinMiscMod/"
# Neither file ships in the depot. Without steam_appid.txt the Steam client
# starts and launches the installed copy alongside this one.
printf '2135150' > "$build/steam_appid.txt"
printf '%s\\Package\\Mod_ElinMiscMod,1\r\n' "$build_win" > "$build/loadorder.txt"

"$ROOT/script/export-build.sh" "$build_win" "$export_win" </dev/null >&2

# A build does not say which version it is until it runs.
mapfile -t dirs < <(find "$exported" -maxdepth 1 -mindepth 1 -type d | sort)
[ "${#dirs[@]}" -eq 1 ] || {
  echo "depot-export.sh: expected one version in $exported, got: ${dirs[*]:-nothing}" >&2
  exit 1
}
basename "${dirs[0]}"
