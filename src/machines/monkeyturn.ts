import type { Machine } from '../engine/types';
import {
  counterCategoriesFromDenominatorTable,
  counterCategoriesFromPercentTable,
} from '../engine/authoring';

// =============================================================================
// スマスロ モンキーターンV(サミー) 設定判別データ
//
// 出典: なな徹 (https://nana-press.com/kaiseki/machine/644/18015/,
//       https://nana-press.com/kaiseki/machine/644/18258/)、
//       altema (https://altema.jp/pachimo/lmonkeygomaiyaku,
//       https://altema.jp/pachimo/lmonkeychokugeki)、
//       DMMぱちタウン (https://p-town.dmm.com/machines/4450)
//
// この機種はBIG/REGのような伝統的なボーナス種別を持たないAT機のため、
// うみねこ2・レヴュースタァライトとは違い「契機×種別」の内訳データが無い
// (triggers/types/outcomes は空。判別ツールの「ボーナス追加」フローは非表示になる)。
// 代わりに、独立したカウントベース証拠源(counterGroups)だけで判別する:
//
// 1. at(総ゲーム数あたりのAT初当たり回数) — 実データ
// 2. gomai(総ゲーム数あたりの5枚役出現回数) — 実データ。通常時・AT中を問わず常時カウント対象
// 3. itemBoat/itemWeakChance/itemStrongChance(激走チャージ中のレア役契機ごとのEXアイテム
//    獲得率) — 実データ。強チェリー契機は全設定100%で判別力を持たないため対象外
//    (referencePointsの参考情報にのみ記載)
// 4. chokugekiStrong/chokugekiWeakChance/chokugekiBoat(通常時のレア役契機ごとのAT直撃率)
//    — 実データ。弱チャンス目・ボート/弱チェリー契機での直撃は設定1・2では発生しない
//    (0%)ことが複数出典で確認されている
//
// なお「激走チャージ終了時のセリフ(波多野の白文字2択)」は設定差ではなく周期(優出モードの
// 周期数)によって振り分けが変わるものと判明したため、判別要素・参考情報のどちらからも除外した。
// =============================================================================

const settings = ['1', '2', '4', '5', '6'];

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
      at: { label: 'AT初当たり', denominators: [299.8, 295.5, 258.8, 235.7, 222.9] },
    }),
  },
  {
    id: 'gomai',
    label: '5枚役',
    unitLabel: '総ゲーム数',
    categories: counterCategoriesFromDenominatorTable(settings, {
      gomai: { label: '5枚役', denominators: [38.15, 36.86, 30.27, 24.51, 22.53] },
    }),
  },
  {
    id: 'itemBoat',
    label: '激走中のボート・弱チェリーでのEXアイテム獲得',
    unitLabel: 'ボート・弱チェリー成立回数(激走チャージ中)',
    categories: counterCategoriesFromPercentTable(settings, {
      get: { label: 'アイテム獲得', percents: [25.0, 26.2, 32.8, 39.1, 43.0] },
      none: { label: '獲得なし', percents: [75.0, 73.8, 67.2, 60.9, 57.0] },
    }),
  },
  {
    id: 'itemWeakChance',
    label: '激走中の弱チャンス目でのEXアイテム獲得',
    unitLabel: '弱チャンス目成立回数(激走チャージ中)',
    categories: counterCategoriesFromPercentTable(settings, {
      get: { label: 'アイテム獲得', percents: [31.3, 32.0, 37.5, 40.6, 46.9] },
      none: { label: '獲得なし', percents: [68.7, 68.0, 62.5, 59.4, 53.1] },
    }),
  },
  {
    id: 'itemStrongChance',
    label: '激走中の強チャンス目でのEXアイテム獲得',
    unitLabel: '強チャンス目成立回数(激走チャージ中)',
    categories: counterCategoriesFromPercentTable(settings, {
      get: { label: 'アイテム獲得', percents: [50.0, 50.8, 58.6, 62.5, 66.4] },
      none: { label: '獲得なし', percents: [50.0, 49.2, 41.4, 37.5, 33.6] },
    }),
  },
  {
    id: 'chokugekiStrong',
    label: '通常時の強チェリー・強チャンス目でのAT直撃',
    unitLabel: '強チェリー・強チャンス目成立回数(通常時)',
    categories: counterCategoriesFromPercentTable(settings, {
      hit: { label: 'AT直撃', percents: [0.4, 1.2, 2.0, 3.9, 6.3] },
      none: { label: '直撃なし', percents: [99.6, 98.8, 98.0, 96.1, 93.7] },
    }),
  },
  {
    id: 'chokugekiWeakChance',
    label: '通常時の弱チャンス目でのAT直撃',
    unitLabel: '弱チャンス目成立回数(通常時)',
    categories: counterCategoriesFromPercentTable(settings, {
      hit: { label: 'AT直撃', percents: [0, 0, 0.8, 2.0, 3.1] },
      none: { label: '直撃なし', percents: [100, 100, 99.2, 98.0, 96.9] },
    }),
  },
  {
    id: 'chokugekiBoat',
    label: '通常時のボート・弱チェリーでのAT直撃',
    unitLabel: 'ボート・弱チェリー成立回数(通常時)',
    categories: counterCategoriesFromPercentTable(settings, {
      hit: { label: 'AT直撃', percents: [0, 0, 0.4, 0.4, 0.4] },
      none: { label: '直撃なし', percents: [100, 100, 99.6, 99.6, 99.6] },
    }),
  },
] satisfies Machine['counterGroups'];

const referencePoints = [
  {
    title: 'AT初当たり確率',
    body:
      'この機種の判別の土台。高設定ほどAT初当たりが軽くなる。' +
      '目安として「分母×100ゲーム」程度回すと結果が収束しやすい。',
    table: {
      rows: [
        {
          label: 'AT初当たり',
          valuesBySetting: {
            '1': '1/299.8', '2': '1/295.5', '4': '1/258.8', '5': '1/235.7', '6': '1/222.9',
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
      'リール上の出目(ベル・リプ・チェリーなど)やサブ液晶、払い出し枚数「5」表示で確認できる。',
    table: {
      rows: [
        {
          label: '5枚役',
          valuesBySetting: {
            '1': '1/38.15', '2': '1/36.86', '4': '1/30.27', '5': '1/24.51', '6': '1/22.53',
          },
        },
      ],
    },
  },
  {
    title: '激走チャージ中のEXアイテム獲得率',
    body:
      '激走チャージ中にレア役(ボート・弱チェリー/弱チャンス目/強チャンス目/強チェリー)が' +
      '成立すると、ポイント加算とは別に「EXアイテム」の獲得抽選が行われる。アイテムはAT当選後に' +
      '効果を発揮し出玉に貢献するため、高設定ほど獲得率が高い。強チェリー契機は全設定で獲得率' +
      '100%のため判別には使えない(参考情報として掲載)。',
    table: {
      rows: [
        {
          label: 'ボート・弱チェリー',
          valuesBySetting: { '1': '25.0%', '2': '26.2%', '4': '32.8%', '5': '39.1%', '6': '43.0%' },
        },
        {
          label: '弱チャンス目',
          valuesBySetting: { '1': '31.3%', '2': '32.0%', '4': '37.5%', '5': '40.6%', '6': '46.9%' },
        },
        {
          label: '強チャンス目',
          valuesBySetting: { '1': '50.0%', '2': '50.8%', '4': '58.6%', '5': '62.5%', '6': '66.4%' },
        },
        {
          label: '強チェリー(判別には使えない)',
          valuesBySetting: { '1': '100%', '2': '100%', '4': '100%', '5': '100%', '6': '100%' },
        },
      ],
    },
  },
  {
    title: 'AT直撃率',
    body:
      '通常時にレア役が成立すると、前兆・優出モードを経ずにATへ直撃することがある。' +
      '強チェリー・強チャンス目からの直撃は設定1→6で約16倍、全レア役合算では約29倍もの' +
      '差がある非常に強力な判別要素。特に弱チャンス目・ボート/弱チェリーからの直撃は設定1・2では' +
      '発生しないため、これらの契機での直撃を確認できれば設定4以上がほぼ確定する。',
    table: {
      rows: [
        {
          label: '強チェリー・強チャンス目',
          valuesBySetting: { '1': '0.4%', '2': '1.2%', '4': '2.0%', '5': '3.9%', '6': '6.3%' },
        },
        {
          label: '弱チャンス目(設定4以上確定)',
          valuesBySetting: { '1': '0%', '2': '0%', '4': '0.8%', '5': '2.0%', '6': '3.1%' },
        },
        {
          label: 'ボート・弱チェリー(設定4以上確定)',
          valuesBySetting: { '1': '0%', '2': '0%', '4': '0.4%', '5': '0.4%', '6': '0.4%' },
        },
      ],
    },
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
