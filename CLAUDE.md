# スロット設定判別ツール

パチスロの設定判別(設定1〜6のどれか)を、観測した事象から**ベイズ推定**で行うWebアプリ。
第一弾は「うみねこのなく頃に2」。ボーナスの**当選契機×種別**、および**総ゲーム数×当選回数**を
入力すると各設定の事後確率が出る(両方入れれば証拠として組み合わさる)。

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
  - `types.ts` — Machine / Trigger / BonusType / Outcome / Observation / BonusRate / SpinTally などの型
  - `bayes.ts` — `computePosterior(machine, observations, { prior?, spinTally? })`。対数空間でベイズ計算
  - `authoring.ts` — 表からデータ生成するヘルパー / `validateMachine`(合計100%チェック)
    - `outcomesFromPercentTable` — 契機×種別の出現割合(%)が既にわかっている場合
    - `outcomesFromDenominatorTable` — 実機スペックによくある「1/N」の生データをそのまま渡せる版。
      設定ごとに自動正規化するので % 換算が不要(umineko2.ts はこちらを使用)
    - `bonusRatesFromDenominatorTable` — BonusRate[](総ゲーム数判別用)を「1/N」表から作る
- `src/machines/` — 機種データ
  - `umineko2.ts` — うみねこ2のデータ
  - `index.ts` — 対応機種の登録簿
- `src/App.tsx` — UI(契機・種別を選んで観測を追加/総ゲーム数と回数を入力 → 事後確率バー表示)

## 判別モデル

証拠源は2つあり、両方を対数尤度の単純な足し算で組み合わせる(片方だけでも動く):

1. **契機×種別の観測列**(`Observation[]`) — 「ボーナスを1回引いたときの内訳の設定差」を尤度に使う。
   総回転数や小役カウントが不要なぶん手軽。各設定について、全 Outcome の確率合計は 1(=100%)になる。
2. **総ゲーム数×カテゴリ別当選回数**(`SpinTally`、機種の `bonusRates` が必要) — 「1ゲームあたりの
   当選確率(BIG合算・REG合算など)の設定差」を多項分布の尤度として使う。カテゴリ同士は排他
   (同じゲームで同時に起こらない)前提。二項係数の項は全設定で共通の定数なので正規化で消えるため省略している。

いずれも事前分布(既定は均等 1/6)を掛けて正規化 → 事後確率。数値安定性のため対数空間で計算する。

## データについて

`umineko2.ts` は、なな徹(nana-press.com)・DMMぱちタウンの公開スペック値を基に実装済み。
契機14種 × 種別6種(黄金郷赤/白、WITCH赤白/白赤、REG赤/白)の複合確率(1/N)をそのまま入力し、
`outcomesFromDenominatorTable` が設定ごとに自動正規化する。

出典側の「ほぼ変化なし」とだけ記載され具体値のない一部REG列(単独/共通ベル/スイカA/1枚役A/B/C)は
仮に1/16384.0を当てている(判別力を持たない前提のため計算への影響は軽微)。より正確な値が
判明したら `umineko2.ts` 内の該当コメント箇所を差し替える。
`validateMachine` は正規化により常に合計100%になるはずなので、警告が出た場合はロジック側のバグを疑う。

## 今後の拡張候補

- 契機×種別以外の判別要素(小役確率、ART/CZ関連、演出示唆など)を Observation の種類として追加
- 事前分布のカスタム(据え置き狙い等)
- 入力履歴の localStorage 永続化
- 他機種の追加
