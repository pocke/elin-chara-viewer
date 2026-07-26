#!/bin/bash
# depot から落としたビルドを起動して CSV を吐かせ、完了したらプロセスを落とす。
#
#   usage: export-build.sh <build-dir-win> <export-dir-win>
#   例: export-build.sh 'C:\elin-depot\686887586342766718' 'C:\elin-export\686887586342766718'
#
# 完了判定は CsvExport.Run が最後に出す "CSV export finished: N files" を
# BepInEx のログで待つ。CSV の本数は版によって違うので、ファイルの増減では判定できない。
set -uo pipefail

build_win="$1"
export_win="$2"
towsl() { local p="/mnt/c/${1#C:\\}"; echo "${p//\\//}"; }
build="$(towsl "$build_win")"
export_dir="$(towsl "$export_win")"
log="$build/BepInEx/LogOutput.log"

TIMEOUT="${TIMEOUT:-600}"

mkdir -p "$export_dir"
rm -f "$log"

bat="/mnt/c/tmp/launch-elin.bat"
mkdir -p /mnt/c/tmp
printf '@echo off\r\nset ELIN_DEPOT_EXPORT_DIR=%s\r\ncd /d %s\r\nstart "" Elin.exe\r\n' \
  "$export_win" "$build_win" > "$bat"
# cmd.exe /c は WSL から呼ぶと起動したプロセスツリーの終了まで戻らないため、
# 前面で待つと以降のポーリングに一度も到達しない。
cmd.exe /c 'C:\tmp\launch-elin.bat' >/dev/null 2>&1 &

start=$(date +%s)
status=timeout
while :; do
  if [ -f "$log" ]; then
    if grep -q 'CSV export finished' "$log"; then status=ok; break; fi
    if grep -q 'CSV export failed' "$log"; then status=export-failed; break; fi
    if grep -qE 'Could not load|Error loading|Failed to load assembly' "$log"; then
      status=mod-load-failed; break
    fi
  fi
  # プロセスが一度も見えないうちに「消えた」と判定しないよう、起動を待つ猶予を置く
  if tasklist.exe 2>/dev/null | grep -qi '^Elin\.exe'; then
    seen=1
  elif [ "${seen:-0}" = 1 ]; then
    status=process-gone; break
  elif [ $(( $(date +%s) - start )) -ge "${STARTUP_GRACE:-60}" ]; then
    status=never-started; break
  fi
  if [ $(( $(date +%s) - start )) -ge "$TIMEOUT" ]; then break; fi
  sleep 3
done
elapsed=$(( $(date +%s) - start ))

cmd.exe /c 'taskkill /f /im Elin.exe' >/dev/null 2>&1
echo "status=$status elapsed=${elapsed}s"
[ -f "$log" ] && grep -E 'CSV export|RecordVersion|IsOffline|Version:' "$log" | head -10
find "$export_dir" -maxdepth 1 -mindepth 1 -type d -printf '%p: ' -exec sh -c 'ls "$1" | wc -l' _ {} \;
[ "$status" = ok ]
