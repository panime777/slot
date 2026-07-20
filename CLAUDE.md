# スロット設定判別ツール

パチスロの設定判別(設定1〜6のどれか)を、観測した事象から**ベイズ推定**で行うWebアプリ。
対応機種は「うみねこのなく頃に2」「少女☆歌劇 レヴュースタァライト」(後者はプレースホルダーデータ)。
機種はヘッダーのハンバーガーメニューから切り替える。ボーナスを引くたびに**その時点の当選ゲーム数・契機・種別**を
入力する1本のフローで、契機×種別の内訳による判別と、総ゲーム数×BIG/REG回数による判別の
両方が自動的に(同じ入力から)計算される。これとは別に、総ゲーム数とBIG/REG回数だけを直接
入力する独立した「簡易設定推測」も用意している。

## 技術構成

- Vite + React + TypeScript
- Node は nvm 管理。**シェルを開くたびに `export NVM_DIR="$HOME/.nvm"; \. "$NVM_DIR/nvm.sh"` が必要**
  (非対話シェルは .bashrc を読まないため、node/npm を使うコマンドは毎回これを前置する)

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
  - `types.ts` — Machine / Trigger / BonusType / Outcome / Observation / BonusRate / SpinTally などの型。
    `Observation` は `{ triggerId, typeId, gameCount }`(gameCount = 当選ゲーム数)。
    `Machine.notes?: string[]` はUIに表示する機種固有の注意点(完走型ARTの記録のコツなど)
  - `bayes.ts`
    - `computePosterior(machine, observations, { prior?, spinTally? })` — 対数空間でベイズ計算
    - `deriveSpinTally(machine, observations)` — 観測列から SpinTally を自動算出(手入力の集計欄は無し)。
      totalSpins は各観測の gameCount の最大値、カテゴリ別回数は各種別の `category` で自動集計
  - `authoring.ts` — 表からデータ生成するヘルパー / `validateMachine`(合計100%チェック)
    - `outcomesFromPercentTable` — 契機×種別の出現割合(%)が既にわかっている場合
    - `outcomesFromDenominatorTable` — 実機スペックによくある「1/N」の生データをそのまま渡せる版。
      設定ごとに自動正規化するので % 換算が不要(umineko2.ts はこちらを使用)
    - `bonusRatesFromDenominatorTable` — BonusRate[](総ゲーム数判別用)を「1/N」表から作る
- `src/machines/` — 機種データ
  - `umineko2.ts` — うみねこ2のデータ。BonusType に `category: 'big' | 'reg'` を持たせ、
    観測から自動でBIG/REG回数を集計できるようにしている
  - `index.ts` — 対応機種の登録簿
- `src/App.tsx` — UI。2つの独立したセクションを持つ
  1. 1つの入力フォーム(当選ゲーム数・契機・種別)で観測を追加するだけで、契機×種別の内訳判別と
     総ゲーム数判別の両方が同時に計算される(`observations` → `deriveSpinTally` で自動算出)
  2. 「簡易設定推測」— 総ゲーム数・BIG回数・REG回数を直接入力するだけの独立したツール。
     `observations` を使わず `computePosterior(machine, [], { spinTally })` で直接計算する

## 判別モデル

証拠源は2つあり、両方を対数尤度の単純な足し算で組み合わせる(片方だけでも動く)。
どちらも同じ観測列(`Observation[]`。1件ずつ「当選ゲーム数・契機・種別」を持つ)から算出されるため、
ユーザーはボーナスを引くたびに1回入力するだけでよい:

1. **契機×種別の内訳**(`Observation` を直接使う) — 「ボーナスを1回引いたときの内訳の設定差」を
   尤度に使う。各設定について、全 Outcome の確率合計は 1(=100%)になる。
2. **総ゲーム数×カテゴリ別当選回数**(`SpinTally`。機種の `bonusRates` が必要) — 「1ゲームあたりの
   当選確率(BIG合算・REG合算など)の設定差」を多項分布の尤度として使う。カテゴリ同士は排他
   (同じゲームで同時に起こらない)前提。二項係数の項は全設定で共通の定数なので正規化で消えるため
   省略している。`SpinTally` は観測列から自動算出(`deriveSpinTally`)することも、
   「簡易設定推測」のように直接入力することもできる。

いずれも事前分布(既定は均等 1/6)を掛けて正規化 → 事後確率。数値安定性のため対数空間で計算する。

## データについて

`umineko2.ts` は、なな徹(nana-press.com)・DMMぱちタウンの公開スペック値を基に実装済み。
契機14種 × 種別6種(黄金郷赤/白、WITCH赤白/白赤、REG赤/白)の複合確率(1/N)をそのまま入力し、
`outcomesFromDenominatorTable` が設定ごとに自動正規化する。

出典側の「ほぼ変化なし」とだけ記載され具体値のない一部REG列(単独/共通ベル/スイカA/1枚役A/B/C)は
仮に1/16384.0を当てている(判別力を持たない前提のため計算への影響は軽微)。より正確な値が
判明したら `umineko2.ts` 内の該当コメント箇所を差し替える。
`validateMachine` は正規化により常に合計100%になるはずなので、警告が出た場合はロジック側のバグを疑う。

## 完走型ARTに関する注意(うみねこ2)

うみねこ2は完走型ART(ARTに入ったら区切り良く終了するまで抜けない方式)のため、ART中に成立した
ボーナスは「今何ゲーム目か」が分かりにくいことがある。当選ゲーム数の入力精度が判別精度に直結するため、
本体オプションでWITCHランプを「一発告知」に設定し、当選した瞬間のゲーム数を都度正確に記録する
使い方を推奨している。このような機種固有の注意点は `umineko2.ts` の `notes` 配列にデータとして
持たせ、App.tsx 側はそれを汎用的に表示するだけ(ハードコードしない)にしている。

## 新しい機種を追加する手順

複数機種への対応を前提にした設計。`src/machines/` にデータファイルを1つ足すだけで対応できる:

1. `src/machines/<id>.ts` を作成し、以下を定義する
   - `settings` — 通常は `['1','2','3','4','5','6']`
   - `triggers` — 当選契機の一覧(`{ id, label }`)
   - `types` — ボーナス種別の一覧。総ゲーム数評価(BIG/REGなど)を使うなら各 BonusType に
     `category`(下記 bonusRates の id に対応)を付ける
   - `outcomes` — 契機×種別の複合確率。データが「1/N」表記なら `outcomesFromDenominatorTable`、
     %表記なら `outcomesFromPercentTable` を使う
   - `bonusRates`(任意) — 総ゲーム数×当選回数による判別を使うなら `bonusRatesFromDenominatorTable`
     でBIG/REGなどカテゴリ別の1ゲームあたり確率を定義する。無くてもアプリは動く
     (該当UIセクションが自動的に非表示になるだけ)
   - `notes`(任意) — その機種固有の注意点(ART方式による記録のコツなど)を文字列配列で
   - コメントで出典(URL)を明記する
2. `src/machines/index.ts` の `machines` 配列に追加する
3. `npm run build` して `validateMachine` の警告(開発時コンソール)が出ないか確認する
4. ヘッダーのハンバーガーメニューに自動で出現し、UIは全て機種データから動的に組み立てられる
   (契機・種別の選択肢、総ゲーム数評価の有無、簡易設定推測の有無、machine.notes の表示、すべて
   `machine` オブジェクトの中身だけで決まる。App.tsx 側にその機種固有の分岐を書く必要はない)

`starlight.ts`(少女☆歌劇 レヴュースタァライト)は、この手順で追加した2機種目の実例。
数値は umineko2.ts の初期実装時と同様、実データ判明までの【プレースホルダー】。
bonusRates/notes を省略した最小構成の例にもなっている(該当UIセクションが自動で非表示になる)。

## 今後の拡張候補

- 契機×種別以外の判別要素(小役確率、ART/CZ関連、演出示唆など)を Observation の種類として追加
- 事前分布のカスタム(据え置き狙い等)
- 入力履歴の localStorage 永続化
