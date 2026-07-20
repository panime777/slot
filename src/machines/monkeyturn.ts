import type { Machine } from '../engine/types';
import {
  counterCategoriesFromDenominatorTable,
  counterCategoriesFromPercentTable,
} from '../engine/authoring';

// =============================================================================
// スマスロ モンキーターンV(サミー) 設定判別データ
//
// 出典: なな徹 (https://nana-press.com/kaiseki/machine/644/18015/)、
//       altema (https://altema.jp/pachimo/lmonkeygomaiyaku)、
//       DMMぱちタウン (https://p-town.dmm.com/machines/4450)
//
// この機種はBIG/REGのような伝統的なボーナス種別を持たないAT機のため、
// うみねこ2・レヴュースタァライトとは違い「契機×種別」の内訳データが無い
// (triggers/types/outcomes は空。判別ツールの「ボーナス追加」フローは非表示になる)。
// 代わりに、独立した3つのカウントベース証拠源(counterGroups)だけで判別する:
//
// 1. at(総ゲーム数あたりのAT初当たり回数) — 実データ
// 2. gomai(総ゲーム数あたりの5枚役出現回数) — 実データ。通常時・AT中を問わず常時カウント対象
// 3. gekisou(激走チャージ回数あたりの終了時セリフ) — 実データ(白文字2択のみ。%表記)。
//    赤文字の激走レア台詞(「おつかれ」「これが艇王と呼ばれる私のレースだ！」)は
//    出現率0.25〜0.75%と非常に稀で、白文字と同じ100%の枠に収まらない特殊枠のため、
//    このグループには含めず referencePoints の参考情報として別掲する。
//
// ⚠️ 設定3の数値はどの出典サイトにも掲載が無く(1・2・4・5・6のみ公開)、
//    設定2と設定4の中間で線形補間した推定値を使っている。
// =============================================================================

const settings = ['1', '2', '3', '4', '5', '6'];

// この機種は契機×種別の内訳データを持たない(counterGroupsのみで判別する)。
const triggers: Machine['triggers'] = [];
const types: Machine['types'] = [];
const outcomes: Machine['outcomes'] = [];

const counterGroups = [
  {
    id: 'at',
    label: 'AT初当たり',
    unitLabel: '総ゲーム数',
    categories: counterCategoriesFromDenominatorTable(settings, {
      at: { label: 'AT初当たり', denominators: [299.8, 295.5, 277.2, 258.8, 235.7, 222.9] },
    }),
  },
  {
    id: 'gomai',
    label: '5枚役',
    unitLabel: '総ゲーム数',
    categories: counterCategoriesFromDenominatorTable(settings, {
      gomai: { label: '5枚役', denominators: [38.15, 36.86, 33.57, 30.27, 24.51, 22.53] },
    }),
  },
  {
    id: 'gekisou',
    label: '激走チャージ後セリフ(波多野・白文字)',
    unitLabel: '激走チャージ回数',
    categories: counterCategoriesFromPercentTable(settings, {
      ochitsuku: { label: '落ち着くんだ憲二…', percents: [50.0, 40.0, 40.0, 40.0, 70.0, 40.0] },
      kehai: { label: 'この気配は！？', percents: [50.0, 60.0, 60.0, 60.0, 30.0, 60.0] },
    }),
  },
] satisfies Machine['counterGroups'];

const referencePoints = [
  {
    title: 'AT初当たり確率',
    body:
      'この機種の判別の土台。高設定ほどAT初当たりが軽くなる。設定3は出典未公開のため' +
      '設定2・4の中間で補間した推定値。目安として「分母×100ゲーム」程度回すと結果が収束しやすい。',
    table: {
      rows: [
        {
          label: 'AT初当たり',
          valuesBySetting: {
            '1': '1/299.8', '2': '1/295.5', '3': '1/277.2(補間)',
            '4': '1/258.8', '5': '1/235.7', '6': '1/222.9',
          },
        },
      ],
    },
  },
  {
    title: '5枚役の出現率',
    body:
      '通常時・AT中を問わず常時カウントする小役。設定1と設定6で約1.7倍の差があり、' +
      'AT初当たりより短時間(目安2,000〜2,250G程度)で収束しやすいとされる有力な判別要素。' +
      'リール上の出目(ベル・リプ・チェリーなど)やサブ液晶、払い出し枚数「5」表示で確認できる。' +
      '設定3は出典未公開のため設定2・4の中間で補間した推定値。',
    table: {
      rows: [
        {
          label: '5枚役',
          valuesBySetting: {
            '1': '1/38.15', '2': '1/36.86', '3': '1/33.57(補間)',
            '4': '1/30.27', '5': '1/24.51', '6': '1/22.53',
          },
        },
      ],
    },
  },
  {
    title: '激走チャージ後セリフ(波多野・白文字)',
    body:
      '激走チャージ終了時、サブ液晶を押すと波多野のセリフが発生する(レバーオン前なら' +
      '何度でも聞き直せる)。白文字2パターンの振り分けに設定差があり、' +
      '「落ち着くんだ憲二…」が設定5だけ突出して高い(70%)のが特徴。設定3は出典未公開のため' +
      '設定2・4の中間で補間した推定値(この2パターンは設定2・4とも同値のため実質補間なし)。',
    table: {
      rows: [
        {
          label: '落ち着くんだ憲二…',
          valuesBySetting: { '1': '50%', '2': '40%', '3': '40%', '4': '40%', '5': '70%', '6': '40%' },
        },
        {
          label: 'この気配は！？',
          valuesBySetting: { '1': '50%', '2': '60%', '3': '60%', '4': '60%', '5': '30%', '6': '60%' },
        },
      ],
    },
  },
  {
    title: '激走チャージ後セリフ(榎木・赤文字/激レア)',
    body:
      '同じ激走チャージ終了時、ごく稀に榎木(赤文字)のセリフに切り替わることがある。' +
      '出現率0.25〜0.75%と極めて低いため、計算には組み込まず「出たら強い」参考情報として扱う。',
    list: [
      { term: '「おつかれ」', detail: '設定2・4・6で0.75%(設定1・5は出現なし)' },
      { term: '「これが艇王と呼ばれる私のレースだ！」', detail: '設定4・6で0.25%、設定5で0.50%(設定1・2は出現なし)' },
    ],
  },
  {
    title: '狙い目(天井・周期)',
    body:
      '天井は「通常時795G+α」と「周期抽選(優出モード)6周期目」の2種類があり、' +
      '設定変更後や特定の敗北後は495G・4周期に短縮される。等価なら410G〜または5周期〜、' +
      '5.6枚交換の現金ならと500G〜が一つの目安とされる。周期回数は液晶右上(激走ポイント下)に' +
      '常時表示されるので、スルー回数(周期を跨いだ回数)を確認しながら立ち回れる。',
  },
] satisfies Machine['referencePoints'];

export const monkeyturn: Machine = {
  id: 'monkeyturn',
  name: 'モンキーターンV',
  settings,
  triggers,
  types,
  outcomes,
  counterGroups,
  referencePoints,
};
