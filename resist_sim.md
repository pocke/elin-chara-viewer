# 耐性シミュレーション機能


耐性シミュレーション機能の仕様を示す。

この機能は、特定の属性の攻撃に対して、それに耐性を持つ敵がどれだけ存在するかを明らかにし、パーティ内での属性の編成を補助します。

## 概要

* path: `/[lang]/[version]/sim/resist`
* method: `GET`
* query parameters:
  * `attackElements` (JSON string): 攻撃属性の配列。
    * 例: `[ { element: "eleFire", isSword: true, isFeatElder: true, isFeatZodiac: true } ]`
    * element: 属性名。Element モデルのaliasに対応
    * isSword: 剣魔法かどうか。`true`なら剣魔法、`false`なら非剣魔法。剣魔法の場合、2段階貫通する
    * isFeatElder: 古代種フィートを持つかどうか。`true`なら持つ、`false`なら持たない。古代種の場合、1段階貫通する
    * isFeatZodiac: 星座フィートを持つかどうか。`true`なら持つ、`false`なら持たない。星座を持つ場合、1段階貫通する

## 機能

このシミュレータは1つのページとして機能する。

画面には攻撃属性の選択フォームと、Charaの一覧が上下に表示されている。
デフォルトでは攻撃属性の選択フォームは空。Charaの一覧は、すべてのCharaが表示されている。

攻撃属性の選択フォームでは、次の項目を入力できる。

* 属性(Element)
  * Element.ts の attackElements から選択する。
  * 選択すると、攻撃属性の配列に追加される。 isSword, isFeatElder, isFeatZodiac はすべてデフォルトでは false
* isSword, isFeatElder, isFeatZodiac
  * チェックボックスで選択する。
  * チェックすると、対象の属性の isSword, isFeatElder, isFeatZodiac のtrue/falseを切り替えられる。
* 削除ボタン
  * 選択した攻撃属性を削除する。


攻撃属性が選択されると、Charaの一覧がフィルタリングされる。
フィルタリングは、攻撃属性と耐性を比較して行う。
まず、耐性の計算を行う(方法は後述)。
計算後の耐性と選択されたすべての攻撃属性を比較し、すべての攻撃属性に対する耐性が1段階以上のCharaのみが表示される。(つまり、どの攻撃属性でも1段階以上耐性を持っているCharaのみが表示される)

耐性の計算ルールは以下の通り。

* 耐性は、5を１つの単位とする
  * 5で1段階、10で2段階となる。
  * 端数は切り捨てる。つまり、4は0段階(耐性なし)、6は1段階となる。
  * 20の4段階が最高で、それ以上は20として扱う。
* isSword は耐性を2段階下げる。
* isFeatElder, isFeatZodiac は耐性を1段階下げる。
* isSword, isFeatElder, isFeatZodiac による低下は0が最低値。
  * ただしもともとの耐性が0未満の場合は、そのまま0未満となる。

Chara の一覧に表示する項目は次の通り。

* 名前
* 各主耐性

Chara一覧の表示は、Chara一覧画面を踏襲する。
