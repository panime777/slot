import type { Machine } from '../engine/types';
import { bonusRatesFromDenominatorTable, outcomesFromPercentTable } from '../engine/authoring';

// =============================================================================
// 少女☆歌劇 レヴュースタァライト -The SLOT-(オーイズミ、スマスロ) 設定判別データ
//
// 出典: なな徹 (https://nana-press.com/post/1626451)、
//       DMMぱちタウン (https://p-town.dmm.com/machines/4706)、
//       パチセブン (https://pachiseven.jp/machines/7105)
//
// ⚠️ 設定3の数値はどの出典サイトにも掲載が無く(1・2・4・5・6のみ公開)、
//    設定2と設定4の中間で線形補間した推定値を使っている(コメントで明記)。
//
// うみねこ2と違い、この機種は比較的新しく契機×種別(表3のような細かい複合確率)の
// 解析データがまだ薄いため、outcomes は【プレースホルダー(要差し替え)】のまま。
// 一方 bonusRates(赤7BIG/青7BIG/REG合算)は複数サイトで裏付けの取れた実数値。
// CZ確率・AT初当たり確率など、計算に組み込めない(CZはボーナスと排他でないため)が
// 有用な情報は referencePoints(設定差ポイントページ)にまとめている。
// =============================================================================

const settings = ['1', '2', '3', '4', '5', '6'];

// 当選契機。役名自体は実在するもの(キラめき目・チャンス目など)だが、
// 契機×種別の出現割合(%)はまだ実データが薄いため下の outcomes はプレースホルダー。
const triggers = [
  { id: 'tanpin', label: '単独' },
  { id: 'cherry', label: 'チェリー' },
  { id: 'suika', label: 'スイカ' },
  { id: 'chance', label: 'チャンス目' },
  { id: 'kirameki', label: 'キラめき目' },
];

// ボーナス種別(実在する3種別)。
const types = [
  { id: 'aka7', label: '赤7BIG', category: 'aka7' },
  { id: 'ao7', label: '青7BIG', category: 'ao7' },
  { id: 'reg', label: 'REG', category: 'reg' },
];

// 契機×種別ごとの出現割合(%)。【プレースホルダー】実データ判明まで仮の値。
const outcomes = outcomesFromPercentTable(settings, {
  'tanpin|aka7': [30, 30, 29, 29, 28, 27],
  'tanpin|ao7': [15, 15, 15, 14, 14, 13],
  'tanpin|reg': [15, 15, 15, 14, 14, 13],
  'cherry|aka7': [10, 10, 10, 10, 11, 12],
  'suika|ao7': [10, 10, 10, 11, 11, 12],
  'chance|reg': [15, 15, 15, 15, 15, 15],
  'kirameki|reg': [5, 5, 6, 7, 7, 8],
});

// 総ゲーム数×当選回数による判別用のカテゴリ別確率(1/N。Nは分母)。
// 赤7BIG・青7BIG・REGの逆数の和が公開されている「ボーナス合算」と一致することを確認済み
// (例: 設定1 = 1/583.0 + 1/479.0 + 1/621.9 ≒ 1/184.8)。実データ。
// 設定3のみ、出典に掲載が無いため設定2・4の中間で線形補間した推定値。
const bonusRates = bonusRatesFromDenominatorTable(settings, {
  aka7: { label: '赤7BIG', denominators: [583.0, 582.6, 583.3, 584.0, 583.3, 585.8] },
  ao7: { label: '青7BIG', denominators: [479.0, 472.3, 456.2, 440.0, 428.9, 421.8] },
  reg: { label: 'REG', denominators: [621.9, 604.3, 565.3, 526.3, 499.7, 465.0] },
});

const referencePoints = [
  {
    title: 'ボーナス合算・内訳',
    body:
      '赤7BIG・青7BIG・REGの3種類。高設定ほど合算確率が上がるが、特に青7BIGとREGの伸びが' +
      '大きく判別に使いやすい(赤7BIGはほぼ横ばい)。設定3は出典未公開のため設定2・4の中間で補間した推定値。',
    table: {
      rows: [
        {
          label: '赤7BIG',
          valuesBySetting: {
            '1': '1/583.0', '2': '1/582.6', '3': '1/583.3(補間)',
            '4': '1/584.0', '5': '1/583.3', '6': '1/585.8',
          },
        },
        {
          label: '青7BIG',
          valuesBySetting: {
            '1': '1/479.0', '2': '1/472.3', '3': '1/456.2(補間)',
            '4': '1/440.0', '5': '1/428.9', '6': '1/421.8',
          },
        },
        {
          label: 'REG',
          valuesBySetting: {
            '1': '1/621.9', '2': '1/604.3', '3': '1/565.3(補間)',
            '4': '1/526.3', '5': '1/499.7', '6': '1/465.0',
          },
        },
        {
          label: 'ボーナス合算',
          valuesBySetting: {
            '1': '1/184.8', '2': '1/182.2', '3': '1/176.1(補間)',
            '4': '1/169.9', '5': '1/165.4', '6': '1/160.6',
          },
        },
      ],
    },
  },
  {
    title: 'CZ「チャレンジ・レヴュー」当選確率',
    body:
      'CZがATへの主な入口。設定1→設定6で約1.48倍の差があり、判別力が高い。' +
      'ただしCZはボーナスと排他ではない(同時に成立しうる)独立抽選のため、' +
      '現在の判別ツールの計算モデル(総ゲーム数評価)には組み込んでいない。',
    table: {
      rows: [
        {
          label: 'CZ確率',
          valuesBySetting: {
            '1': '1/265.9', '2': '1/254.7', '3': '1/231.2(補間)',
            '4': '1/207.6', '5': '1/190.3', '6': '1/179.5',
          },
        },
      ],
    },
  },
  {
    title: 'AT初当たり確率',
    body: 'CZ経由も含めたAT初当たり全体の確率。設定1→設定6で約1.55倍の差。',
    table: {
      rows: [
        {
          label: 'AT初当たり',
          valuesBySetting: {
            '1': '1/359.6', '2': '1/346.8', '3': '1/312.0(補間)',
            '4': '1/277.1', '5': '1/255.7', '6': '1/232.5',
          },
        },
      ],
    },
  },
  {
    title: 'キラめき目+REG(複合確率)',
    body:
      '特定役とボーナス種別の同時当選確率にも設定差がある一例。設定1と設定6のみ公開されており' +
      '(約1/7282 → 約1/3449、約2.1倍)、設定2〜5の数値や他の役の同様のデータは現時点で見つかっていない。',
  },
] satisfies Machine['referencePoints'];

export const starlight: Machine = {
  id: 'starlight',
  name: '少女☆歌劇 レヴュースタァライト',
  settings,
  triggers,
  types,
  outcomes,
  bonusRates,
  referencePoints,
};
