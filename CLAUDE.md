# スロット設定判別ツール

パチスロの設定判別(設定1〜6のどれか)を、観測した事象から**ベイズ推定**で行うWebアプリ。
対応機種は「うみねこのなく頃に2」(実データ)「少女☆歌劇 レヴュースタァライト」(counterGroupsは
実データ、outcomesはプレースホルダー)「モンキーターンV」(全カウントベースの実データ。
契機×種別の内訳は無し)。機種ごとに3ページある: 「判別ツール」(入力→事後確率計算)、
「設定差ポイント」(判別計算には使わない、既知の設定差要素をまとめた読み物ページ)、
「履歴」(投資・回収とボーナス記録をセッション単位で保存した実戦ログ)。
機種切り替えはヘッダーのハンバーガーメニュー、ページ切り替えはタブで行う。
URLは `/:machineId/tool` `/:machineId/points` `/:machineId/history` で、直接リンク・リロードにも
対応(react-router)。判別ツールの入力中データ・履歴はどちらも localStorage に永続化されるため、
リロードしても消えない(機種ごとにキーを分けているので他機種のデータと混ざらない)。

判別ツールは機種のデータ次第で2つの独立した仕組みを持つ:

1. **契機×種別の観測ログ**(triggers/types/outcomes を持つ機種のみ表示) — ボーナスを引くたびに
   その時点の当選ゲーム数・契機・種別を1件ずつ記録する。契機×種別の内訳による判別と、
   カウントベースの判別(下記)の両方が自動的に(同じ入力から)計算される
2. **設定推測(カウント入力)** — 「AT初当たり」「5枚役」「激走チャージ後セリフ」のように、
   母数の単位が異なる複数の独立した判別要素を、機種は好きなだけ持てる(`counterGroups`)。
   母数とカテゴリ別回数を直接入力するだけで、入力された要素だけが合算されて1つの結果になる。
   観測ログを持つ機種ではこれが「簡易設定推測」(折りたたみ、副次的なクイックツール)として、
   観測ログを持たない機種(モンキーターンVなど)ではこれが唯一かつ常時表示のメインツールになる

投資・回収(枚)も入力でき、「このセッションを履歴に保存」で現在の記録一式を履歴に切り出し、
入力をリセットして次のセッションに備えられる。

## 技術構成

- Vite + React + TypeScript + react-router-dom
- Node は nvm 管理。**シェルを開くたびに `export NVM_DIR="$HOME/.nvm"; \. "$NVM_DIR/nvm.sh"` が必要**
  (非対話シェルは .bashrc を読まないため、node/npm を使うコマンドは毎回これを前置する)
- `vercel.json` — Vercelでのデプロイ時、`/umineko2/points` のような直リンクが404にならないよう
  全パスを `index.html` にリライトするSPAフォールバック設定

## コマンド

```bash
export NVM_DIR="$HOME/.nvm"; \. "$NVM_DIR/nvm.sh"
npm run dev      # 開発サーバ
npm run build    # tsc 型チェック + 本番ビルド
npm run lint     # oxlint
```

## 設計の要

**エンジン(機種非依存)とデータ(機種固有)を分離**している。機種を増やすときはデータを足すだけ。

- `src/engine/` — 判別エンジン。ここに機種固有の知識を入れない
  - `types.ts` — Machine / Trigger / BonusType / Outcome / Observation / CounterCategory /
    CounterGroup / CounterObservation / ReferencePoint などの型。
    `Observation` は `{ triggerId, typeId, gameCount }`(gameCount = 当選ゲーム数)。
    `CounterGroup` は「母数の単位(unitLabel)+ 排他的なカテゴリ一覧」のまとまり1つ
    (例: 「AT初当たり」「5枚役」「激走チャージ後セリフ」はそれぞれ別グループ)。
    グループ同士は互いに独立(同時に起こり得る)とみなし、対数尤度を単純に合算する。
    `Machine.notes?: string[]` はUIに表示する機種固有の注意点(完走型ARTの記録のコツなど)。
    `Machine.referencePoints?: ReferencePoint[]` は「設定差ポイント」ページ用の読み物データ
    (title/body/任意のtable・list。判別計算には一切使わない)
  - `bayes.ts`
    - `computePosterior(machine, observations, { prior?, counterObservations? })` — 対数空間で
      ベイズ計算。`counterObservations` は `CounterObservation[]`(複数グループぶん渡せる)
    - `deriveCounterObservations(machine, observations)` — 観測列から、契機×種別の `category` 経由で
      自動集計できる CounterObservation[] を算出する(手入力の集計欄は無し)。母数は各観測の
      gameCount の最大値。「激走チャージ後セリフ」のように observations に現れないカテゴリを持つ
      グループはここでは算出されない(UI側で手入力してもらう)
  - `authoring.ts` — 表からデータ生成するヘルパー / `validateMachine`(合計100%チェック。
    outcomes を持たない機種ではスキップされる)
    - `outcomesFromPercentTable` / `outcomesFromDenominatorTable` — 契機×種別の複合確率を
      %表記/「1/N」表記から作る(後者は設定ごとに自動正規化)
    - `counterCategoriesFromDenominatorTable` / `counterCategoriesFromPercentTable` — 1つの
      CounterGroup.categories を「1/N」表記/%表記から作る
- `src/machines/` — 機種データ
  - `umineko2.ts` — うみねこ2のデータ(実データ)。BonusType に `category: 'big' | 'reg'` を持たせ、
    観測から自動でBIG/REG回数を集計できるようにしている
  - `starlight.ts` — レヴュースタァライトのデータ。counterGroups(赤7BIG/青7BIG/REG)は実データ、
    outcomes(契機×種別)は解析データが薄いためプレースホルダー
  - `monkeyturn.ts` — モンキーターンVのデータ。BIG/REGのような伝統的なボーナス種別を持たない
    AT機のため triggers/types/outcomes は空(判別ツールの観測ログUIは自動的に非表示になる)。
    AT初当たり・5枚役・激走チャージ後セリフの3つの独立した counterGroups だけで判別する
  - `index.ts` — 対応機種の登録簿
- `src/Layout.tsx` — ヘッダー(タイトル・機種名・ハンバーガーメニュー)とページタブ(判別ツール/設定差
  ポイント/履歴)を持つ共通レイアウト。`<Outlet key={machine.id} context={{ machine }} />` で
  子ページに machine を渡す。key に machine.id を使うことで機種切り替え時に子ページの state を
  確実にリセットしている
- `src/pages/ToolPage.tsx` — 判別ツール本体。`machine.triggers.length > 0 && machine.types.length > 0`
  (`hasEventFlow`)で観測ログUI一式の表示有無を切り替え、`machine.counterGroups` の数だけ
  カウント入力ブロックを動的に描画する(`QuickSection` — hasEventFlow なら折りたたみ式の
  「簡易設定推測」、そうでなければ常時表示の「設定推測」として)
- `src/pages/PointsPage.tsx` — 「設定差ポイント」ページ。`machine.referencePoints` をそのまま
  カード+表/リストとして描画するだけ(計算ロジック無し)
- `src/pages/HistoryPage.tsx` — 「履歴」ページ。保存済み `Session[]` を新しい順に一覧表示し、
  展開するとそのセッションのボーナス記録が見える。合計差枚も表示。削除も可能
- `src/App.tsx` — ルーティング定義のみ(`Routes`/`Route`)。実際のUIはLayout/pages側にある
- `src/hooks/useLocalStorageState.ts` — `useState` と同じ感覚で使え、値の変更を自動で
  localStorage に保存する汎用フック。ToolPage の observations/投資/回収/sessions で使用
- `src/session.ts` — `Session` 型(投資・回収・observationsのひとまとまり)、`netCoins`(差枚計算)、
  `storageKeys`(機種ごとにユニークな localStorage キーを作るヘルパー)

## 判別モデル

証拠源は2種類あり、対数尤度の単純な足し算で自由に組み合わせられる(どれか1つだけでも動く):

1. **契機×種別の内訳**(`Observation` を直接使う。機種に outcomes が必要) — 「ボーナスを1回
   引いたときの内訳の設定差」を尤度に使う。各設定について、全 Outcome の確率合計は 1(=100%)になる。
2. **カウントベースの証拠**(`CounterObservation[]`。機種の `counterGroups` が必要) — 「母数のうち
   カテゴリごとに何回当選したか」を、グループごとに独立な多項分布の尤度として使う。
   グループ内のカテゴリ同士は排他(同じ試行で同時に起こらない)前提で、二項係数の項は全設定で
   共通の定数なので正規化で消えるため省略している。グループ同士は互いに独立とみなし、
   複数グループぶんの対数尤度を単純に合算できる(例: AT初当たり + 5枚役 + 激走チャージ後セリフを
   同時に渡すと、3つの証拠が合算された1つの事後確率になる)。`CounterObservation` は観測列から
   自動算出(`deriveCounterObservations`)することも、直接入力することもできる

いずれも事前分布(既定は均等 1/6)を掛けて正規化 → 事後確率。数値安定性のため対数空間で計算する。

**独立性の注意**: 同じ CounterGroup 内のカテゴリは必ず排他(同じ試行で同時に起こらない)でなければ
ならない。逆に、独立した現象(例: AT当選と5枚役は同じゲームで両方起こり得る)は同じグループに
入れず、別グループとして分ける。CZ確率のように「ボーナスと排他かどうか判断できない」データは
counterGroups に入れず、referencePoints(読み物)に留めるのが安全。

## データについて

`umineko2.ts` は、なな徹(nana-press.com)・DMMぱちタウンの公開スペック値を基に実装済み。
契機14種 × 種別6種(黄金郷赤/白、WITCH赤白/白赤、REG赤/白)の複合確率(1/N)をそのまま入力し、
`outcomesFromDenominatorTable` が設定ごとに自動正規化する。

出典側の「ほぼ変化なし」とだけ記載され具体値のない一部REG列(単独/共通ベル/スイカA/1枚役A/B/C)は
仮に1/16384.0を当てている(判別力を持たない前提のため計算への影響は軽微)。より正確な値が
判明したら `umineko2.ts` 内の該当コメント箇所を差し替える。
`validateMachine` は正規化により常に合計100%になるはずなので、警告が出た場合はロジック側のバグを疑う。

`starlight.ts`(少女☆歌劇 レヴュースタァライト、オーイズミ)は counterGroups(赤7BIG/青7BIG/REG)・
referencePoints(ボーナス内訳/CZ確率/AT初当たり確率/終了画面/獲得枚数/タッチボイスなど)がなな徹・
DMMぱちタウン・パチセブン・altema・slot-solution等で裏付けの取れた実データ。outcomes(契機×種別の
内訳)は解析がまだ薄く、実データが確認できたのは「キラめき目+REG」の設定1・6のみだったため、
無理に埋めず【プレースホルダー】のままにしてある。

`monkeyturn.ts`(モンキーターンV、サミー)は、なな徹・altema・DMMぱちタウンで裏付けの取れた
AT初当たり確率・5枚役出現率・激走チャージ後セリフ(白文字2択)の実データ。激走チャージの
赤文字レア台詞(出現率0.25〜0.75%)は白文字と同じ100%の枠に収まらないため counterGroups には
含めず referencePoints の参考情報として別掲している。

**設定3のデータが無いことが多い**: うみねこ2以外(レヴュースタァライト、モンキーターンV)は
どの出典サイトも設定1・2・4・5・6のみ公開しており、設定3のデータが無い(なな徹・DMM・パチセブン・
P-WORLD・flick7など複数サイトで直接確認済み。実機は法規上6段階あるはずだが、解析サイト側の
慣習で設定3だけ省いた5点表記になっているようだ)。**線形補間などの推測値で埋めることはせず、
その機種の `settings` 自体を5段階(`['1','2','4','5','6']`)にして「わからないものとして扱う」**
方針にしている。機種によって欠けている設定が異なる可能性もある(例: 平和のように設定1が
非公開のケースもあると聞く)ため、新しい機種を追加する際は毎回、出典側の表に本当に6段階
揃っているかを確認すること。

## 完走型ARTに関する注意(うみねこ2)

うみねこ2は完走型ART(ARTに入ったら区切り良く終了するまで抜けない方式)のため、ART中に成立した
ボーナスは「今何ゲーム目か」が分かりにくいことがある。当選ゲーム数の入力精度が判別精度に直結するため、
本体オプションでWITCHランプを「一発告知」に設定し、当選した瞬間のゲーム数を都度正確に記録する
使い方を推奨している。このような機種固有の注意点は `umineko2.ts` の `notes` 配列にデータとして
持たせ、ToolPage 側はそれを汎用的に表示するだけ(ハードコードしない)にしている。

## 新しい機種を追加する手順

複数機種への対応を前提にした設計。`src/machines/` にデータファイルを1つ足すだけで対応できる:

1. `src/machines/<id>.ts` を作成し、以下を定義する
   - `settings` — 通常は `['1','2','3','4','5','6']`。ただし出典側の表に一部の設定
     (設定3が多い)が無いことがよくあるので、必ず複数サイトで6段階揃っているか確認し、
     無ければ無理に補間せずその設定を除いた配列にする(レヴュースタァライト・
     モンキーターンVは `['1','2','4','5','6']`)
   - `triggers`/`types`/`outcomes` — 契機×種別の複合確率データがあるなら定義する
     (`outcomesFromDenominatorTable`/`outcomesFromPercentTable`)。無い機種(AT機など)は
     3つとも空配列 `[]` にすればよい。判別ツールの観測ログUIが自動的に非表示になる
   - `counterGroups`(任意) — カウントベースの判別要素を、母数の単位ごとにグループとして
     好きなだけ定義できる。各グループは
     `{ id, label, unitLabel, categories: counterCategoriesFromDenominatorTable(...) }`。
     グループ内のカテゴリは必ず排他にすること(排他かどうか怪しいものは referencePoints へ)
   - `notes`(任意) — その機種固有の注意点(ART方式による記録のコツなど)を文字列配列で
   - `referencePoints`(任意) — 「設定差ポイント」ページに載せる読み物。判別計算に使えない情報
     (CZ確率など排他性が保証できないものや、データが薄くて計算に組み込めない実データ)の
     置き場としても使える。`{ title, body, table?, list? }`
     - `table` — 設定1〜6の数値比較(確率など)を横並びで見せたいとき
       `{ rows: [{ label, valuesBySetting }] }`
     - `list` — 設定列を持たない「パターン→示唆内容」の対応一覧(ボイスの台詞、終了画面の
       名前など)を見やすいカード行で見せたいとき `{ term, detail }[]`。ボイス・演出系は
       出現確率が非公開なことが多く、その旨を body に明記するとよい
   - コメントで出典(URL)を明記する
2. `src/machines/index.ts` の `machines` 配列に追加する
3. `npm run build` して `validateMachine` の警告(開発時コンソール)が出ないか確認する
4. ヘッダーのハンバーガーメニューに自動で出現し、UIは全て機種データから動的に組み立てられる
   (契機・種別の選択肢の有無、カウント入力ブロックの数、machine.notes/referencePoints の表示、
   すべて `machine` オブジェクトの中身だけで決まる。ToolPage 側にその機種固有の分岐を書く必要はない)

## 今後の拡張候補

- ゴッドイーター機種の追加(設定差ポイント含め、ユーザーがよく実践する機種として次点)
- 事前分布のカスタム(据え置き狙い等)
- 履歴のエクスポート/インポート(端末間引き継ぎ。現状は端末のlocalStorage内のみ)
- 履歴ページでの集計(機種別・期間別の合計差枚グラフなど)
