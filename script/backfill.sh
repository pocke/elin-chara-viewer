#!/bin/bash
# Steam の depot から過去バージョンを復元する。1 manifest につき、ダウンロード →
# 起動して CSV をエクスポート → 検証 → アーカイブ → ビルドを Dropbox へ退避、
# までを行う。https://github.com/pocke/elin-chara-viewer/issues/303
#
#   usage: script/backfill.sh [--limit N] [--newest-first] [--retry-failed] [--dry-run]
#
# 進捗は tmp/backfill/state.tsv に 1 manifest 1 行で追記される。done の行は
# 読み飛ばすので、中断しても同じコマンドで再開できる。
#
# Steam のログインは連続 66 回ほどでレート制限に入り、そこから叩き続けると
# 復帰までの時間が伸びる。
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARCHIVE="${ARCHIVE:-$ROOT/../elin-chara-viewer-data}"
STATE_DIR="$ROOT/tmp/backfill"
STATE="$STATE_DIR/state.tsv"
MANIFESTS="$ROOT/manifests.json"

DD="${DD:-/mnt/c/Users/kuwab/AppData/Local/Microsoft/WinGet/Packages/SteamRE.DepotDownloader_Microsoft.Winget.Source_8wekyb3d8bbwe/DepotDownloader.exe}"
MOD="${MOD:-/mnt/c/Program Files (x86)/Steam/steamapps/common/Elin/Package/Mod_ElinMiscMod}"
DROPBOX="${DROPBOX:-/mnt/c/Users/kuwab/Dropbox/elin-depot}"
STEAM_USER="${STEAM_USER:-p_ck_}"
MIN_FREE_MB="${MIN_FREE_MB:-8000}"
MAX_CONSECUTIVE_FAILURES="${MAX_CONSECUTIVE_FAILURES:-3}"

limit=0
order=oldest
dry_run=
retry_failed=
while [ $# -gt 0 ]; do
  case "$1" in
    --limit) limit="${2:?--limit needs a number}"; shift 2 ;;
    --newest-first) order=newest; shift ;;
    --retry-failed) retry_failed=1; shift ;;
    --dry-run) dry_run=1; shift ;;
    *) echo "unknown option: $1" >&2; exit 1 ;;
  esac
done
case "$limit" in ''|*[!0-9]*) echo "--limit must be a number" >&2; exit 1 ;; esac

mkdir -p "$STATE_DIR" || exit 1
touch "$STATE" || exit 1

# 固定パスの共有物 (ダウンロード先、filelist、起動用の bat) を使うので、
# 二重に走ると互いのビルドとゲームプロセスを壊し合う。
exec 9>"$STATE_DIR/.lock"
flock -n 9 || { echo "another backfill is already running" >&2; exit 1; }

[ -f "$ARCHIVE/index.json" ] || { echo "archive not found: $ARCHIVE/index.json" >&2; exit 1; }
[ -f "$MOD/ElinMiscMod.dll" ] || { echo "mod not found: $MOD/ElinMiscMod.dll" >&2; exit 1; }
[ -x "$DD" ] || { echo "DepotDownloader not found: $DD" >&2; exit 1; }
mkdir -p "$DROPBOX" /mnt/c/tmp || exit 1

# 15 時間走る間に Steam が Elin を更新すると MOD の中身が入れ替わるので、
# 開始時点のものを控えて以降はそれを配る。
mod_snapshot="$STATE_DIR/mod"
rm -rf "$mod_snapshot" && mkdir -p "$mod_snapshot" || exit 1
cp "$MOD/ElinMiscMod.dll" "$MOD/package.xml" "$mod_snapshot/" || exit 1

if [ -n "$dry_run" ]; then :; else
  cat > /mnt/c/tmp/filelist.txt <<'EOF' || exit 1
regex:^(?!.*(\.resS$|\.resource$|_Elona[\\/]Texture[\\/]|_Elona[\\/]Etc[\\/]Gallery[\\/]|_Elona[\\/]Portrait[\\/])).*$
EOF
fi

record() {
  printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$1" "$2" "$3" "$4" "$5" "$(tr -d '\t\n' <<< "${6:-}")" >> "$STATE"
}
done_ids() { awk -F'\t' '$4=="done" || $4=="duplicate" {print $1}' "$STATE"; }
attempted_ids() { awk -F'\t' '{print $1}' "$STATE"; }
version_seen() { awk -F'\t' -v v="$1" '$5==v {found=1} END {exit !found}' "$STATE"; }

# 列の増減はゲーム自身のスキーマ変更でも起きるので、離れた版と比べると検出
# したい破損と区別がつかなくなる。
baseline_dir() {
  ruby -rjson -r"$ROOT/script/archive_repo" -e '
    archive, date, version = ARGV
    index = JSON.parse(File.read(File.join(archive, "index.json")))
    key = [date, ArchiveRepo.version_key(version)]
    prev = index
      .reject { |e| e["version"] == version }
      .select { |e| ([e["releaseDate"], ArchiveRepo.version_key(e["version"])] <=> key) == -1 }
      .max_by { |e| [e["releaseDate"], ArchiveRepo.version_key(e["version"])] }
    print prev ? File.join(archive, "v", prev["slug"], "csv") : ""
  ' "$ARCHIVE" "$1" "$2"
}

archived_csv_dir() {
  ruby -rjson -r"$ROOT/script/archive_repo" -e '
    archive, version = ARGV
    dir = File.join(archive, "v", ArchiveRepo.slugify(version), "csv")
    print Dir.exist?(dir) ? dir : ""
  ' "$ARCHIVE" "$1"
}

targets=$(ruby -rjson -e '
  rows = JSON.parse(File.read(ARGV[0]))
  abort "manifests.json is empty" if rows.empty?
  rows = rows.sort_by { |r| r["seenAt"] }
  rows = rows.reverse if ARGV[1] == "newest"
  rows.each { |r| puts [r["manifestId"], r["date"], r["branch"]].join("\t") }
' "$MANIFESTS" "$order") || exit 1
[ -n "$targets" ] || { echo "no targets read from $MANIFESTS" >&2; exit 1; }

processed=0
consecutive_failures=0
echo "== backfill start ($(done_ids | wc -l) already done of $(wc -l <<< "$targets"))"

# 判断待ちであって機械の故障ではないので、連続失敗の勘定には入れない。
defer() {
  record "$1" "$2" "$3" "$4" "${5:-}" "${6:-}"
  echo "   $4: ${6:-}" >&2
}

fail() {
  record "$1" "$2" "$3" "$4" "${5:-}" "${6:-}"
  echo "   $4: ${6:-}" >&2
  consecutive_failures=$((consecutive_failures + 1))
  if [ "$consecutive_failures" -ge "$MAX_CONSECUTIVE_FAILURES" ]; then
    echo "ABORT: $consecutive_failures 連続で失敗。原因を調べてから再開すること。" >&2
    exit 3
  fi
}

while IFS=$'\t' read -r id date branch <&3; do
  [ -z "${id:-}" ] && continue
  grep -qxF "$id" <<< "$(done_ids)" && continue
  if [ -z "$retry_failed" ] && grep -qxF "$id" <<< "$(attempted_ids)"; then continue; fi
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
  [ -n "$dry_run" ] && continue

  free_mb=$(df -m --output=avail /mnt/c | tail -1 | tr -d ' ')
  if [ "$free_mb" -lt "$MIN_FREE_MB" ]; then
    echo "ABORT: C: の空きが ${free_mb}MB しかない (最低 ${MIN_FREE_MB}MB)" >&2
    exit 4
  fi

  rm -rf "$build" "$export_dir"
  # 過去の manifest に対する request code は nightly branch でしか発行されない。
  # public 指定だと現行ビルド以外は 401 になる。
  out=$(timeout -k 60 3600 "$DD" -app 2135150 -depot 2135153 -manifest "$id" -branch nightly \
    -username "$STEAM_USER" -remember-password -filelist 'C:\tmp\filelist.txt' \
    -dir "$build_win" 2>&1 </dev/null)
  if grep -q 'RateLimitExceeded' <<< "$out"; then
    echo "ABORT: Steam のログインレート制限。時間を空けて同じコマンドで再開する。" >&2
    exit 2
  fi
  if ! grep -q 'Total downloaded' <<< "$out"; then
    rm -rf "$build"
    fail "$id" "$date" "$branch" download-failed "" \
      "$(tr '\r' '\n' <<< "$out" | grep -Ei 'no manifest request code|error|denied' | head -1)"
    continue
  fi

  mkdir -p "$build/Package/Mod_ElinMiscMod" \
    && cp "$mod_snapshot/ElinMiscMod.dll" "$mod_snapshot/package.xml" "$build/Package/Mod_ElinMiscMod/" \
    && printf '2135150' > "$build/steam_appid.txt" \
    && printf '%s\\Package\\Mod_ElinMiscMod,1\r\n' "$build_win" > "$build/loadorder.txt" || {
      rm -rf "$build"
      fail "$id" "$date" "$branch" setup-failed "" "could not install the mod"
      continue
    }

  if ! timeout -k 60 900 "$ROOT/script/export-build.sh" "$build_win" "$export_win" \
      > "$STATE_DIR/$id.log" 2>&1 </dev/null; then
    rm -rf "$build" "$export_dir"
    fail "$id" "$date" "$branch" export-failed "" "$(grep -m1 'status=' "$STATE_DIR/$id.log")"
    continue
  fi

  version=$(basename "$(find "$export_dir" -maxdepth 1 -mindepth 1 -type d | head -1)")
  if [ -z "$version" ]; then
    rm -rf "$build" "$export_dir"
    fail "$id" "$date" "$branch" export-failed "" "no version directory"
    continue
  fi
  echo "   version: $version"

  base=$(baseline_dir "$date" "$version") || {
    echo "ABORT: baseline を決められない ($ARCHIVE が壊れている?)" >&2; exit 5
  }
  if [ -n "$base" ]; then
    npx --prefix "$ROOT" tsx "$ROOT/script/check-export.ts" "$export_dir/$version" --baseline "$base" \
      > "$STATE_DIR/$id.check" 2>&1
  else
    npx --prefix "$ROOT" tsx "$ROOT/script/check-export.ts" "$export_dir/$version" \
      > "$STATE_DIR/$id.check" 2>&1
  fi
  if [ $? -ne 0 ]; then
    rm -rf "$build"
    fail "$id" "$date" "$branch" check-failed "$version" "see tmp/backfill/$id.check"
    continue
  fi

  # 同じバージョン名を複数の manifest が名乗る。既にアーカイブ済みの版を
  # 上書きすると、先に入っていた内容もリリース日も失われる。
  existing=$(archived_csv_dir "$version")
  action=new
  if [ -n "$existing" ]; then
    if diff -rq "$export_dir/$version" "$existing" >/dev/null 2>&1; then
      version_seen "$version" && action=duplicate || action=redate
    else
      action=conflict
    fi
  fi

  case "$action" in
    conflict)
      rm -rf "$build"
      defer "$id" "$date" "$branch" version-conflict "$version" "differs from the archived $version"
      continue ;;
    duplicate)
      echo "   duplicate of an already restored $version" ;;
    *)
      if ! ruby "$ROOT/script/archive_release.rb" "$ARCHIVE" "$version" \
          --db "$export_dir" --channel "$channel" --release-date "$date" >/dev/null; then
        rm -rf "$build"
        fail "$id" "$date" "$branch" archive-failed "$version" "archive_release.rb failed"
        continue
      fi
      feat=$(ruby "$ROOT/script/extract_feat.rb" --archive "$ARCHIVE" --version "$version" 2>&1)
      if [ $? -ne 0 ] && ! grep -q 'no decompiled build' <<< "$feat"; then
        echo "   warning: extract_feat.rb failed: $(head -1 <<< "$feat")" >&2
      fi ;;
  esac

  part="$DROPBOX/.${date}_${id}.tar.zst.part"
  if ! tar -C "$(dirname "$build")" -cf - \
      --exclude='Package/Mod_ElinMiscMod' --exclude='loadorder.txt' \
      --exclude='steam_appid.txt' --exclude='BepInEx/LogOutput.log' "$(basename "$build")" \
      | zstd -3 -q -o "$part" -f; then
    rm -f "$part"
    fail "$id" "$date" "$branch" archive-failed "$version" "tar/zstd failed"
    continue
  fi
  mv "$part" "$DROPBOX/${date}_${id}.tar.zst" || {
    fail "$id" "$date" "$branch" archive-failed "$version" "could not move the archive into place"
    continue
  }
  size=$(du -m "$DROPBOX/${date}_${id}.tar.zst" | cut -f1)
  rm -rf "$build" "$export_dir"

  consecutive_failures=0
  status=done
  [ "$action" = duplicate ] && status=duplicate
  record "$id" "$date" "$branch" "$status" "$version" "${size}MB"
  echo "   $status $version, ${size}MB to Dropbox"
done 3<<< "$targets"

# state.tsv は追記のみなので、再試行して成功した manifest には失敗行も残る。
summary() {
  awk -F'\t' '
    $4=="done" || $4=="duplicate" { ok[$1]=$4; next }
    { bad[$1]=$4 }
    END {
      for (id in ok) if (ok[id]=="done") d++; else dup++
      for (id in bad) if (!(id in ok)) f++
      printf "%d done, %d duplicate, %d failed", d, dup, f
    }' "$STATE"
}
echo "== finished: $(summary)"
