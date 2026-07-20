# スロット設定判別ツール

パチスロの設定判別(設定1〜6のどれか)を、観測した事象から**ベイズ推定**で行うWebアプリ。
第一弾は「うみねこのなく頃に2」。ボーナスの**当選契機×種別**を入力すると各設定の事後確率が出る。

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
  - `types.ts` — Machine / Trigger / BonusType / Outcome / Observation などの型
  - `bayes.ts` — `computePosterior(machine, observations, prior?)`。対数空間でベイズ計算
  - `authoring.ts` — `outcomesFromPercentTable`(表からデータ生成)/ `validateMachine`(合計100%チェック)
- `src/machines/` — 機種データ
  - `umineko2.ts` — うみねこ2のデータ
  - `index.ts` — 対応機種の登録簿
- `src/App.tsx` — UI(契機・種別を選んで観測を追加 → 事後確率バー表示)

## 判別モデル

「**ボーナスを1回引いたときの内訳(契機×種別)の設定差**」を尤度に使う。
総回転数や小役カウントが不要なぶん手軽。各設定について、全 Outcome の確率合計は 1(=100%)になる。
各観測の尤度ベクトルを掛け合わせ、事前分布(既定は均等 1/6)を掛けて正規化 → 事後確率。

## データについて(重要)

現在 `umineko2.ts` の数値は**すべてプレースホルダー(要差し替え)**。
実スペック値に置き換える際は、基本的に `outcomesFromPercentTable` に渡す表(各行の6数字 = 設定1〜6 の%)だけを編集すればよい。
`validateMachine` が各設定の合計が100%かを開発時に警告する。

## 今後の拡張候補

- 契機×種別以外の判別要素(小役確率、ART/CZ関連、演出示唆など)を Observation の種類として追加
- 事前分布のカスタム(据え置き狙い等)
- 入力履歴の localStorage 永続化
- 他機種の追加
