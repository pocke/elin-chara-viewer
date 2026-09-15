# 隠しキャラの判定 (`Chara#isHidden`)

`src/lib/models/chara.ts` の `Chara#isHidden()` は、キャラ一覧画面の「通常ゲームでは登場しないキャラを表示」チェックボックスで隠すキャラを判定する。

## 判定基準

`isHidden` が表すのは「**通常プレイでマップ上にキャラクターとして出てこない**」こと。次の3つは「登場」に含めない。

- ワンブロックモード (`game.IsSurvival`) 専用の出現。通常プレイの外として扱う
- drama (会話シーン) に立ち絵として出るだけのもの
- 図鑑・フィギュア・像・アクター (見た目) としての登録。登場の根拠にしない

## 実装

タグ判定と ID 列挙の二本立て。

```ts
if (this.tags().includes('noRandomProduct')) {
  return true;
}
const hiddenCharaIds = [ /* ... */ ];
if (hiddenCharaIds.includes(this.row.id)) {
  return true;
}
```

`noRandomProduct` タグを持つキャラはこのタグだけで隠れるので、列挙リストには含めない (`eyth`, `horome` はこれに該当するため列挙から外してある)。

## 隠す29体と根拠

内訳は次の3グループで、重複はない。列挙リストに実際に入るのは後半2グループの19体。`noRandomProduct` タグの10体はタグ判定だけで隠れるので列挙には含めない。

- `noRandomProduct` タグを持つ10体: `chara`, `test_chicken`, `player`, `bat_trans`, `broom_chara`, `at`, `korgon`, `swordkeeper2`, `eyth`, `horome`
- `race == 'god'` かつ `boss` タグを持たない8体: `ehekatl`, `elin`, `itz`, `jure`, `kumiromi`, `lulwy`, `mani`, `opatos`。race=god は他に `keeper_garden`/`swordkeeper`/`swordkeeper2` の3体がいるが `boss` タグを持つためこの条件から外れ、`eyth`/`horome` は `boss` タグを持たない race=god だが上のタグ持ちグループに含めたのでここには入れない
- 通常プレイでマップにキャラとして出る根拠が無い11体: `nerun`, `strangeScientist`, `alien3`, `alien_queen`, `wynan`, `doppelganger`, `beholder`, `yatsu`, `yochlol`, `ancient_golem`, `mirage`

| id | 日本語名 | 英語名 | LV | 根拠 |
|---|---|---|---|---|
| chara | (ランダム名) | — | 1 | noRandomProduct タグ |
| test_chicken | テストチキン | test chicken | 1 | noRandomProduct タグ |
| player | (ランダム名) | — | 1 | noRandomProduct タグ |
| bat_trans | コウモリ | bat | 2 | noRandomProduct タグ |
| broom_chara | 魔女のホウキ | witch's broom | 10 | noRandomProduct タグ |
| at | ＠ | @ | 10 | noRandomProduct タグ |
| korgon | コルゴンのパパ | Papa Corgon | 35 | noRandomProduct タグ |
| swordkeeper2 | イノス＝トゥルス2 | Innos Tur'as 2 | 2500000 | noRandomProduct タグ |
| eyth | エイス | Eyth | 99999999 | noRandomProduct タグ + race=god |
| horome | ホロメ | Horome | 99999999 | noRandomProduct タグ + race=god |
| ehekatl | エヘカトル | Ehekatl | 99999999 | race=god |
| elin | エリン | Elin | 99999999 | race=god |
| itz | イツパロトル | Itzpaltol | 99999999 | race=god |
| jure | ジュア | Jure | 99999999 | race=god |
| kumiromi | クミロミ | Kumiromi | 99999999 | race=god |
| lulwy | ルルウィ | Lulwy | 99999999 | race=god |
| mani | マニ | Mani | 99999999 | race=god |
| opatos | オパートス | Opatos | 99999999 | race=god |
| nerun | ネルン | Nerun | 1 | drama に会話役として出るだけ |
| strangeScientist | 謎の科学者 | Strange Scientist | 15 | `SurvivalManager#ListUnrecruitedUniques` 経由のワンブロック未勧誘ユニークとしてのみ出る。charaText.csv にセリフ (calm/aggro/dead/kill) はあるが、これも勧誘後にしか流れないので通常プレイでの登場を意味しない |
| alien3 | エイリアン | alien | 18 | 参照なし。Ylvapedia の Alien 配下にページ無し |
| alien_queen | エイリアン・マザー | Alien Mother | 29 | 参照なし。Ylvapedia にページ無し |
| wynan | ワイナン | Wynan | 36 | ワンブロックのクエストボード勧誘でのみ出る |
| doppelganger | ドッペルゲンガー | doppelganger | 38 | 参照なし |
| beholder | ビホルダー | beholder | 45 | 参照なし。Ylvapedia の Eye 配下にページ無し |
| yatsu | 昔から左下にいたヤツ | The one that’s always been in the bottom left | 50 | 参照なし。Ylvapedia の Yith 配下にページ無し |
| yochlol | ヨクロール | yochlol | 60 | 参照なし。Ylvapedia にページはあるが出会い方の記述が無い |
| ancient_golem | 古代の石の巨人 | Ancient stone golem | 75 | 参照なし。Ylvapedia の Ent 配下にページ無し |
| mirage | ミラージュ | Mirage | 90 | 参照なし。Ylvapedia の Eulderna 配下にページ無し |

### マニについて

charas.csv にマニは5体いる。隠すのは `mani` (race=god, LV=99999999) だけ。

- `mamani` (LV=700000000): アクリ・テオラに出現する実体。Ylvapedia の `God/Mani` はこの個体を指す
- `mamani2` (LV=1): `God/Mani(Copy)`
- `namamani` (LV=32): `Yerles/Mani(Gunner)`。拠点の住人にできる (`trait=UniqueCharaNoJoin` のため冒険には同行できない)
- `namamani2` (LV=15): `Yerles/Mani(Tourist)`。拠点の住人にできる (`trait=UniqueCharaNoJoin` のため冒険には同行できない)

`Zone_Aquli.cs` の `Zone_Aquli#OnVisitNewMapOrRegenerate` が、`namamani` と `namamani2` の両方を拠点に抱えている状態でアクリ・テオラを訪れると `mamani` を生成する。`mani` (LV=99999999, race=god) とは別の実体なので、Ylvapedia で「God/Mani」の LV を確認するときは `mani` の LV (99999999) と混同しないこと。

## `npm run check:hidden`

列挙リストが実際のゲームデータと合っているかを検証するスクリプト。`script/check-hidden-charas.rb` を実行する。

```sh
npm run check:hidden -- --game "/mnt/c/Program Files (x86)/Steam/steamapps/common/Elin" --source tmp/Elin-Decompiled --db "db/$(cat versions/nightly)"
```

- `--game`: Elin のインストールディレクトリ。既定 `/mnt/c/Program Files (x86)/Steam/steamapps/common/Elin`
- `--source`: [Elin-Decompiled](https://github.com/Elin-Modding-Resources/Elin-Decompiled) のチェックアウト。既定 `tmp/Elin-Decompiled`
- `--db`: CSV ディレクトリ。既定 `db/<versions/EA の中身>`

charas.csv の各行について、次の4つを「登場の根拠」として集める。

1. マップ blueprint (`<game>/Package/_Elona/Map/*.z`, `*.s`) の固定配置
2. decompiled ソース (`<source>/Elin/*.cs`。UI・デバッグ系のファイルと Plugins.* 等のサブディレクトリは除く) の文字列リテラル
3. CSV テーブル (`<db>/*.csv`。charas.csv 自身も含めて全ファイルを走査するが、charas.csv だけは自分自身の行の ID と一致するトークンを除く) からの参照。次の列は根拠にしない: `charas.csv` の `idActor`/`faith` (見た目・信仰名の流用)、`collectibles.csv`/`religions.csv` の `id` と `persons.csv` の `id`/`idActor` (同じキャラを図鑑・フィギュア・信仰対象・drama 専用の人物として登録した行であって、マップへの配置ではない。`persons.csv` の `nerun` 行はまさにこれ)、`things.csv` の `name`/`name_JP` (釣った魚 "shark"/"turtle" のようにアイテムの表示名がキャラ名を借りているだけ)、`langGeneral.csv` の `filter` (プレイリスト編集画面で `nerun` がしゃべる UI 上のセリフをまとめたグループ名で、これもマップへの配置ではない)、`charaText.csv` の `id` (セリフはワンブロック専用の未勧誘ユニークにも用意されているため、根拠にすると `strangeScientist` を見落とす)
4. `tag` に `party` を含む (`ZoneEventMusic.cs:52` が演奏会依頼のマップでそのキャラを ID 指定のまま生成し、配置時に敵対度が中立未満なら中立まで引き上げる。座標だけがランダム)。ただし同ファイル54行目に `LV >= maxLv * 2` (`maxLv` はクエストの難易度依存) で足切りする条件があり、スクリプトはこれを見ていない。現状 `party` タグ単独が根拠になるのは `big_sister_alt` (LV95) だけなので結果に影響しないが、これより LV が高い `party` タグ持ちが増えたら黙って「登場する」扱いになる

`chance == 0` かつ根拠が1つも無いキャラを隠すべき候補とし、`race == 'god'` かつ `boss` タグを持たないキャラ、`noRandomProduct` タグを持つキャラと合わせて「隠すべき ID 集合」を作る。そこから `noRandomProduct` タグ持ちを除いたものを chara.ts の列挙リストと突き合わせ、両方向の差分を報告する。

- 列挙に無いのに根拠ゼロ: chara.ts に追加が要る
- 列挙にあるのに根拠が見つかった: 実装や DLC 追加でそのキャラが実際に登場するようになった、または判定が誤っている。原因を調べて列挙から外すか判定式を見直す

差分が出たら、まず報告された ID を Ylvapedia (後述) と decompiled ソースで検索し、根拠が本当に無いか、逆に既存の根拠抽出が見落としているだけかを確認する。次の「自動判定で間違えた3パターン」も併せて見ること。

### いつ実行するか

`check:hidden` は手元の Elin インストールと、それに対応する decompiled ソースのチェックアウトが要るため CI では動かせない。`versions/EA` または `versions/nightly` を更新した (= `update.sh` がゲームのバージョンを上げた) タイミングで、手元の環境から手動で実行すること。`update.sh` はバージョンを上げてそのまま PR を自動マージするので、ここで実行し忘れるとバージョン更新のたびに追随できなくなるという元の不具合が再発する。

既定の `--db` は `db/<versions/EA の中身>` (stable) を見る。実際のバージョン更新はほとんど `versions/nightly` 側で起きるので、そちらを更新したときは `--db` を明示しないと更新前の stable を検証したまま「差分ゼロ」を返してしまう。

```sh
# versions/EA を更新したとき
npm run check:hidden

# versions/nightly を更新したとき
npm run check:hidden -- --db "db/$(cat versions/nightly)"
```

`--source` (decompiled のチェックアウト) と `--game` (Steam のインストール) も検証したいバージョンに合わせること。`--source` がずれていても exit 0 のまま続行する。警告が出るのは `--source` が git チェックアウトで、直近のコミット件名と `--db` のディレクトリ名の両方にバージョン番号が含まれ、かつ両者が異なるときだけで、それ以外 (`.git` が無い展開済みディレクトリ、コミット件名にバージョン番号が無い等) は無言で進む。`--game` にはバージョンの突き合わせが一切無いので、Steam 側のブランチ (`public`/`nightly`) を手動で合わせること。

## 自動判定で間違えた3パターン

候補を絞り込む過程で、次の3つは機械的な根拠抽出では判定できなかった。次に調べる人が同じ落とし穴を踏まないように書いておく。

1. **`big_sister_alt`**: [`ZoneEventMusic.cs:52`](https://github.com/Elin-Modding-Resources/Elin-Decompiled/blob/2c67f91207b90607e8f92bf5759d7833cbfdb365/Elin/ZoneEventMusic.cs#L52) の `charas.rows.Where(row => row.tag.Contains("party"))` で演奏会依頼のマップにそのキャラとして生成される (座標はランダムだが ID は tag 一致で決まる。中立 NPC はこれとは別に `CharaGen.CreateFromFilter("c_neutral", ...)` で生成される箇所が同じメソッド内に2つある)。`tag` によるクエリで ID を名指ししないので、文字列リテラル検索では原理的に拾えない。参考: [Big Sister (Ylvapedia)](https://ylvapedia.wiki/wiki/Elin:Bestiary/Roran/Big_Sister)
2. **`wynan`**: Ylvapedia に "only through Oneblock recruitment" とあり、`SurvivalManager#ListUnrecruitedUniques` (`quality==4` かつ `race != "god"` かつ `size` が空、`LV < flags.raidLv + 10` の未勧誘ユニーク。`fiama`/`loytel`/`nino`/`big_daddy`/`big_daddy2`/`littleOne`/`mamani` は個別に除外) 経由で、`FactionBranch` が `game.IsSurvival` のときだけ呼ぶワンブロックの勧誘枠にのみ出る。「通常プレイの外」という線引きはコードの構造だけからは決まらず、ゲームプレイの知識が要る。参考: [Wynan (Ylvapedia)](https://ylvapedia.wiki/wiki/Elin:Bestiary/Norland/Wynan)。セルフレビューで同じ経路の `strangeScientist` (謎の科学者) も見つかり、列挙に追加した
3. **`God/Mani`**: Ylvapedia の `God/Mani` は LV 700,000,000 で、`mani` (LV=99999999) ではなく `mamani` を指す。charas.csv にマニが5体いるうちのどれを指しているかは LV を突き合わせないと取り違える。参考: [God/Mani (Ylvapedia)](https://ylvapedia.wiki/wiki/Elin:Bestiary/God/Mani)

この3つがあるため、判定ロジックの完全自動化 (`chance == 0` の候補からさらに絞り込むところまでの自動化) は退けた。`chara.ts` の列挙は手で更新し、`check:hidden` はその正しさを検証する役割にとどめる。

`race == 'god'` をコードの規則として書く案も検討したが、判定を規則と列挙の二本立てにすると読みにくくなるため退けた。ID 列挙に統一している。

## 調査に使った外部情報源

[Ylvapedia](https://ylvapedia.wiki/) の Bestiary。MediaWiki API で一覧とページ本文が取れる。

- ページ一覧: `https://ylvapedia.wiki/api.php?action=query&list=allpages&apnamespace=3000&apprefix=Bestiary&format=json`
- 本文: `https://ylvapedia.wiki/api.php?action=parse&page=<title>&prop=wikitext&format=json`

race ごとにページのカテゴリが分かれているので、そのカテゴリにキャラのページが無ければ「実装されていない、または通常プレイで遭遇しない」可能性が高いという当たりを付けられる。ただし `yochlol` のようにページ自体はあっても出会い方の記述が無いケースもあるため、ページの有無だけで判定を確定させず、本文まで確認すること。
