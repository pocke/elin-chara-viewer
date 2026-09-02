---
name: update-elin-data
description: Run update.sh to fetch the latest Elin game build and update the CSV database.
disable-model-invocation: true
allowed-tools: Bash(./update.sh)
---

`update.sh` は Elin の最新ビルドを Steam からダウンロードし、CSV データベース (`db/`) を更新するスクリプト。実行すると最初に `git checkout -qf origin/master` で作業ツリーを origin/master に戻すため、未コミットの変更は実行前に退避する。EA・nightly のどちらもバージョンが変わっていなければ commit せず exit 1 で終わる。バージョンが進んでいれば `db/` を更新し、commit・push・PR 作成・auto-merge の設定まで行う。

1. 未コミットの変更がないことを確認する
2. リポジトリのルートを cwd にした Bash ツールで、`run_in_background: true` を指定し、コマンドには `./update.sh` だけを渡す。`cd` を前置したり絶対パスにすると、frontmatter の事前承認 (`Bash(./update.sh)` は完全一致のみ許可) にマッチせず確認プロンプトが出る
3. 完了を待ち、終了コードと出力からユーザーに結果を報告する
   - 更新あり (exit 0): 更新後のバージョン、作成された PR の URL、HEAD が新しい topic ブランチに移っていること
   - 更新なし (exit 1 かつ出力に `neither branch moved; nothing to release`): 両チャンネルともバージョンが変わっていなかったことを伝える
   - それ以外の失敗: エラーメッセージと、リポジトリが detached HEAD のまま `db/`・`versions/` が変更されている可能性があることを伝える
