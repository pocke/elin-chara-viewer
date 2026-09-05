#!/bin/bash
# depot から落としたビルドを起動して CSV を吐かせ、完了したらプロセスを落とす。
#
#   usage: export-build.sh <build-dir-win> <export-dir-win>
#   例: export-build.sh 'C:\elin-depot\686887586342766718' 'C:\elin-export\686887586342766718'
#
# 完了判定は BepInEx ログの "CSV export finished" を待つ。CSV の本数は版に
# よって違うので、ディレクトリを見ても完了と実行中を区別できない。
set -uo pipefail

build_win="${1:?build dir (windows path) required}"
export_win="${2:?export dir (windows path) required}"
case "$build_win" in
  [A-Za-z]:\\*) ;;
  *) echo "expected a windows path, got: $build_win" >&2; exit 1 ;;
esac

build="$(wslpath -u "$build_win")" || exit 1
export_dir="$(wslpath -u "$export_win")" || exit 1
log="$build/BepInEx/LogOutput.log"

TIMEOUT="${TIMEOUT:-600}"
STARTUP_GRACE="${STARTUP_GRACE:-60}"
POLL="${POLL:-3}"
MISSES_BEFORE_GONE="${MISSES_BEFORE_GONE:-3}"

# このビルドから起動したプロセスだけを見て、それだけを落とす。同じマシンで
# Steam 経由でインストールした Elin が動いていることがある。
ps_filter="Get-Process Elin -ErrorAction SilentlyContinue | Where-Object { \$_.Path -like '$build_win\\*' }"
running() {
  [ -n "$(powershell.exe -NoProfile -Command "$ps_filter | Select-Object -First 1 -ExpandProperty Id" 2>/dev/null | tr -d '\r')" ]
}
stop() { powershell.exe -NoProfile -Command "$ps_filter | Stop-Process -Force" >/dev/null 2>&1; }

mkdir -p "$export_dir" /mnt/c/tmp || exit 1
rm -f "$log"

trap 'stop; rm -f "${bat:-}"' EXIT
bat="/mnt/c/tmp/launch-elin-$$.bat"
printf '@echo off\r\nset ELIN_DEPOT_EXPORT_DIR=%s\r\ncd /d %s\r\nstart "" Elin.exe\r\n' \
  "$export_win" "$build_win" > "$bat"
# WSL の interop 経由で起動した Windows プロセスは wslhost の PreferSystem32
# 緩和策を継承し、build 直下の winhttp.dll (doorstop の注入口) ではなく
# System32 の winhttp.dll を読む。すると BepInEx が注入されず mod も動かず、
# CSV を吐かないままタイトル画面で止まる。WMI で起動すると親が WSL の系譜から
# 外れ、この継承を避けられる。Create は起動後すぐ戻るので前面で呼んでよい。
bat_win="$(wslpath -w "$bat")"
powershell.exe -NoProfile -Command \
  "Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = 'cmd.exe /c \"$bat_win\"' } | Out-Null" \
  </dev/null >/dev/null 2>&1

start=$(date +%s)
status=timeout
seen=0
misses=0
while :; do
  if [ -f "$log" ]; then
    if grep -qa 'CSV export finished' "$log"; then status=ok; break; fi
    if grep -qa 'CSV export failed' "$log"; then status=export-failed; break; fi
  fi

  if running; then
    seen=1
    misses=0
  elif [ "$seen" = 1 ]; then
    # 1 回見えないのは Windows 側が忙しいだけのことがあり、誤検出はビルドの
    # 再ダウンロード 1 本分になる。
    misses=$((misses + 1))
    [ "$misses" -ge "$MISSES_BEFORE_GONE" ] && { status=process-gone; break; }
  elif [ $(( $(date +%s) - start )) -ge "$STARTUP_GRACE" ]; then
    status=never-started; break
  fi

  if [ $(( $(date +%s) - start )) -ge "$TIMEOUT" ]; then break; fi
  sleep "$POLL"
done
elapsed=$(( $(date +%s) - start ))

stop
# 呼び出し側がこのディレクトリを tar で読むが、プロセスが消えたあとも
# Windows がしばらくファイルを掴んでいる。
for _ in 1 2 3 4 5 6 7 8 9 10; do running || break; sleep 1; done

echo "status=$status elapsed=${elapsed}s"
[ -f "$log" ] && grep -aE 'CSV export|RecordVersion' "$log" | head -5
[ "$status" = ok ]
