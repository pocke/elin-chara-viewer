#!/bin/bash
# Steam の depot から過去バージョンを復元する。1 manifest につき、ダウンロード →
# 起動して CSV をエクスポート → 検証 → アーカイブ → ビルドを Dropbox へ退避、
# までを行う。https://github.com/pocke/elin-chara-viewer/issues/303
#
#   usage: script/backfill.sh [--limit N] [--newest-first] [--dry-run]
#
# 進捗は tmp/backfill/state.tsv に 1 manifest 1 行で追記される。done の行は
# 読み飛ばすので、中断しても同じコマンドで再開できる。
#
# Steam のログインはレート制限が厳しく、一度踏むと復帰に 40 分近くかかる。
# 制限を検出したら残りを処理せずに終了する。
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARCHIVE="${ARCHIVE:-$ROOT/../elin-chara-viewer-data}"
STATE_DIR="$ROOT/tmp/backfill"
STATE="$STATE_DIR/state.tsv"
MANIFESTS="$ROOT/manifests.json"

DD='/mnt/c/Users/kuwab/AppData/Local/Microsoft/WinGet/Packages/SteamRE.DepotDownloader_Microsoft.Winget.Source_8wekyb3d8bbwe/DepotDownloader.exe'
MOD='/mnt/c/Program Files (x86)/Steam/steamapps/common/Elin/Package/Mod_ElinMiscMod'
DROPBOX='/mnt/c/Users/kuwab/Dropbox/elin-depot'
STEAM_USER=p_ck_

limit=0
order=oldest
dry_run=
while [ $# -gt 0 ]; do
  case "$1" in
    --limit) limit="$2"; shift 2 ;;
    --newest-first) order=newest; shift ;;
    --dry-run) dry_run=1; shift ;;
    *) echo "unknown option: $1" >&2; exit 1 ;;
  esac
done

mkdir -p "$STATE_DIR" "$DROPBOX" /mnt/c/tmp
touch "$STATE"

# エクスポートに要らないファイルは落とさない。この除外セットは、除外したコピー
# からのエクスポートが完全なコピーからのものとバイト単位で一致することを
# 確認して決めてある。DepotDownloader はパス区切りを正規化するので両方許す。
cat > /mnt/c/tmp/filelist.txt <<'EOF'
regex:^(?!.*(\.resS$|\.resource$|_Elona[\\/]Texture[\\/]|_Elona[\\/]Etc[\\/]Gallery[\\/]|_Elona[\\/]Portrait[\\/])).*$
EOF

record() { printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$1" "$2" "$3" "$4" "$5" "$6" >> "$STATE"; }
done_ids() { awk -F'\t' '$4=="done" {print $1}' "$STATE"; }

# 直前のリリース日を持つアーカイブ済みバージョンを baseline に使う。列の変化は
# 隣接バージョン同士でしか意味を持たないため。
baseline_dir() {
  ruby -rjson -e '
    archive, date = ARGV
    index = JSON.parse(File.read(File.join(archive, "index.json")))
    prev = index.select { |e| e["releaseDate"] < date }.max_by { |e| e["releaseDate"] }
    print prev ? File.join(archive, "v", prev["slug"], "csv") : ""
  ' "$ARCHIVE" "$1"
}

targets=$(ruby -rjson -e '
  rows = JSON.parse(File.read(ARGV[0]))
  rows = rows.sort_by { |r| r["seenAt"] }
  rows = rows.reverse if ARGV[1] == "newest"
  rows.each { |r| puts [r["manifestId"], r["date"], r["branch"]].join("\t") }
' "$MANIFESTS" "$order")

processed=0
skipped=$(done_ids | wc -l)
echo "== backfill start (done so far: $skipped)"

# 対象一覧は fd 3 から読む。ループ内で起動する cmd.exe や DepotDownloader が
# stdin を読み進めてしまい、残りの対象が消える。
while IFS=$'\t' read -r id date branch <&3; do
  [ -z "${id:-}" ] && continue
  grep -qx "$id" <<< "$(done_ids)" && continue
  if [ "$limit" -gt 0 ] && [ "$processed" -ge "$limit" ]; then
    echo "== reached --limit $limit"; break
  fi
  processed=$((processed + 1))

  channel=stable
  [ "$branch" = nightly ] && channel=nightly
  build_win="C:\\elin-depot\\$id"
  build="/mnt/c/elin-depot/$id"
  export_win="C:\\elin-export\\$id"
  export_dir="/mnt/c/elin-export/$id"

  echo "== [$processed] $date $id ($branch)"
  if [ -n "$dry_run" ]; then continue; fi

  rm -rf "$build" "$export_dir"
  out=$(timeout 3600 "$DD" -app 2135150 -depot 2135153 -manifest "$id" -branch nightly \
    -username "$STEAM_USER" -remember-password -filelist 'C:\tmp\filelist.txt' \
    -dir "$build_win" 2>&1 </dev/null)
  if grep -q 'RateLimitExceeded' <<< "$out"; then
    echo "ABORT: Steam のログインレート制限。時間を空けて同じコマンドで再開する。" >&2
    exit 2
  fi
  if ! grep -q 'Total downloaded' <<< "$out"; then
    reason=$(tr '\r' '\n' <<< "$out" | grep -Ei 'no manifest request code|error|denied' | head -1)
    record "$id" "$date" "$branch" download-failed "" "$reason"
    echo "   download failed: $reason" >&2
    rm -rf "$build"
    continue
  fi

  mkdir -p "$build/Package/Mod_ElinMiscMod"
  cp "$MOD/ElinMiscMod.dll" "$MOD/package.xml" "$build/Package/Mod_ElinMiscMod/"
  printf '2135150' > "$build/steam_appid.txt"
  printf '%s\\Package\\Mod_ElinMiscMod,1\r\n' "$build_win" > "$build/loadorder.txt"

  if ! "$ROOT/script/export-build.sh" "$build_win" "$export_win" > "$STATE_DIR/$id.log" 2>&1; then
    record "$id" "$date" "$branch" export-failed "" "$(grep -m1 'status=' "$STATE_DIR/$id.log")"
    echo "   export failed: $(grep -m1 'status=' "$STATE_DIR/$id.log")" >&2
    rm -rf "$build" "$export_dir"
    continue
  fi

  version=$(basename "$(find "$export_dir" -maxdepth 1 -mindepth 1 -type d | head -1)")
  if [ -z "$version" ]; then
    record "$id" "$date" "$branch" export-failed "" "no version directory"
    rm -rf "$build" "$export_dir"
    continue
  fi
  echo "   version: $version"

  base=$(baseline_dir "$date")
  if [ -n "$base" ]; then
    npx --prefix "$ROOT" tsx "$ROOT/script/check-export.ts" "$export_dir/$version" --baseline "$base" \
      > "$STATE_DIR/$id.check" 2>&1
    check=$?
  else
    npx --prefix "$ROOT" tsx "$ROOT/script/check-export.ts" "$export_dir/$version" \
      > "$STATE_DIR/$id.check" 2>&1
    check=$?
  fi
  if [ $check -ne 0 ]; then
    record "$id" "$date" "$branch" check-failed "$version" "$(grep -c '^error' "$STATE_DIR/$id.check") errors"
    echo "   check failed; see $STATE_DIR/$id.check" >&2
    rm -rf "$build"
    continue
  fi

  ruby "$ROOT/script/archive_release.rb" "$ARCHIVE" "$version" \
    --db "$export_dir" --channel "$channel" --release-date "$date" >/dev/null
  # decompiled の履歴は EA 23.41 から始まるので、それより古い版では feat 修正を
  # 作れない。archive 側は featModifier:false のまま成立する。
  ruby "$ROOT/script/extract_feat.rb" --archive "$ARCHIVE" --version "$version" >/dev/null 2>&1

  tar -C /mnt/c/elin-depot -cf - \
    --exclude='Package/Mod_ElinMiscMod' --exclude='loadorder.txt' \
    --exclude='steam_appid.txt' --exclude='BepInEx/LogOutput.log' "$id" \
    | zstd -3 -q -o "$DROPBOX/${date}_${id}.tar.zst" -f
  rm -rf "$build" "$export_dir"

  record "$id" "$date" "$branch" done "$version" "$(du -m "$DROPBOX/${date}_${id}.tar.zst" | cut -f1)MB"
  echo "   archived $version, $(du -m "$DROPBOX/${date}_${id}.tar.zst" | cut -f1)MB to Dropbox"
done 3<<< "$targets"

echo "== finished: $(awk -F'\t' '$4=="done"' "$STATE" | wc -l) done, $(awk -F'\t' '$4!="done"' "$STATE" | wc -l) failed"
