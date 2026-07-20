import type { Machine } from '../engine/types';
import { counterCategoriesFromDenominatorTable, outcomesFromDenominatorTable } from '../engine/authoring';

// =============================================================================
// うみねこのなく頃に2 設定判別データ
//
// 出典: なな徹 (https://nana-press.com/kaiseki/machine/1089/34695/)、
//       DMMぱちタウン (https://p-town.dmm.com/machines/4925)
//
// このデータは2つの独立した証拠源に対応する:
//
// 1. outcomes(表3: 契機×種別の複合確率) — 「ボーナスを1回引いたとき、それがどの
//    契機×種別だったか」の条件付き分布。1/N をそのまま並べ、outcomesFromDenominatorTable が
//    設定ごとに合計1へ自動正規化する。
// 2. counterGroups(表1: BIG合算/REG合算) — 「総ゲーム数のうちBIG/REGが何回出たか」を
//    多項分布の尤度として使う、ボーナス出現ペースそのものによる判別。
//
// 表2(種別ごとの合算)は表3の周辺確率(行の合計)にあたるため、表3を過不足なく入力すれば
// 重複計上にならない。出典側の丸め由来で厳密な合算一致は取れない(数%程度のズレ)が、
// 判別用途としては表3の相対値がそのまま活きるため実装上は無視してよい。
// =============================================================================

const settings = ['1', '2', '3', '4', '5', '6'];

// 当選契機。id は table のキーに使う。label は画面表示。
const triggers = [
  { id: 'tanpin', label: '単独' },
  { id: 'kyotsu_bell', label: '共通ベル' },
  { id: 'suika_a', label: 'スイカA' },
  { id: 'suika_b', label: 'スイカB' },
  { id: 'ichimai_a', label: '1枚役A' },
  { id: 'ichimai_b', label: '1枚役B' },
  { id: 'ichimai_c', label: '1枚役C' },
  { id: 'cherry', label: 'チェリー' },
  { id: 'kakutei_a', label: '確定役A' },
  { id: 'kakutei_b', label: '確定役B' },
  { id: 'reach_replay_a', label: 'リーチ目リプレイA' },
  { id: 'reach_replay_b', label: 'リーチ目リプレイB' },
  { id: 'reach_replay_c', label: 'リーチ目リプレイC' },
  { id: 'replay', label: 'リプレイ' },
];

// ボーナス種別(色/タイプ)。category は counterGroups(下記)内カテゴリの id に対応し、
// 総ゲーム数評価(SpinTally)のカテゴリ当選回数を観測から自動集計するために使う。
const types = [
  { id: 'kogane_aka', label: '黄金郷ボーナス(赤赤赤)', category: 'big' },
  { id: 'kogane_shiro', label: '黄金郷ボーナス(白白白)', category: 'big' },
  { id: 'witch_akashiro', label: 'WITCHボーナス(赤赤白)', category: 'big' },
  { id: 'witch_shiroaka', label: 'WITCHボーナス(白白赤)', category: 'big' },
  { id: 'reg_akaao', label: 'REG(赤赤青)', category: 'reg' },
  { id: 'reg_shiroao', label: 'REG(白白青)', category: 'reg' },
];

// 全設定でほぼ変化がなく判別に使えない列は、出典に明記されているとおり
// 1/16384.0(全設定共通)として扱う。
const FLAT = [16384, 16384, 16384, 16384, 16384, 16384];

// 契機×種別ごとの複合確率(1/N。Nは分母)。並びは settings(設定1〜6)の順。
// null はその設定でその組み合わせが起こらない(=対象外)ことを表す。
const outcomes = outcomesFromDenominatorTable(settings, {
  // --- 黄金郷ボーナス(赤赤赤) ---
  'kyotsu_bell|kogane_aka': FLAT,
  'suika_b|kogane_aka': FLAT,
  'ichimai_a|kogane_aka': FLAT,
  'ichimai_c|kogane_aka': [16384.0, 13107.2, 10922.7, 9362.3, 8192.0, 7281.8], // 判別に使える
  'kakutei_b|kogane_aka': FLAT,
  'reach_replay_b|kogane_aka': FLAT,

  // --- 黄金郷ボーナス(白白白) ---
  'tanpin|kogane_shiro': FLAT,
  'suika_a|kogane_shiro': [13107.2, 13107.2, 13107.2, 13107.2, 13107.2, 13107.2], // 全設定同値
  'ichimai_b|kogane_shiro': [7281.8, 6553.6, 5957.8, 5461.3, 5041.2, 4681.1], // 判別に使える
  'cherry|kogane_shiro': FLAT,

  // --- WITCHボーナス(赤赤白) ---
  'tanpin|witch_akashiro': FLAT,
  'kyotsu_bell|witch_akashiro': FLAT,
  'suika_a|witch_akashiro': FLAT,
  'suika_b|witch_akashiro': FLAT,
  'ichimai_a|witch_akashiro': FLAT,
  'cherry|witch_akashiro': FLAT,
  'reach_replay_a|witch_akashiro': FLAT,
  'reach_replay_b|witch_akashiro': FLAT,
  'ichimai_b|witch_akashiro': [5957.8, 5461.3, 5041.2, 4681.1, 4681.1, 4681.1], // 判別に使える
  'ichimai_c|witch_akashiro': [5041.2, 4681.1, 4369.1, 4096.0, 3855.1, 3640.9], // 判別に使える
  'kakutei_a|witch_akashiro': [16384.0, 13107.2, 10922.7, 9362.3, 8192.0, 7281.8], // 最も判別力が高い

  // --- WITCHボーナス(白白赤) ---
  'tanpin|witch_shiroaka': FLAT,
  'kyotsu_bell|witch_shiroaka': FLAT,
  'suika_a|witch_shiroaka': FLAT,
  'kakutei_b|witch_shiroaka': FLAT,
  'replay|witch_shiroaka': FLAT,
  'cherry|witch_shiroaka': FLAT,
  'reach_replay_c|witch_shiroaka': FLAT,
  'ichimai_a|witch_shiroaka': [4681.1, 4681.1, 4681.1, 4681.1, 4681.1, 4681.1], // 全設定同値(判別不可)
  'ichimai_b|witch_shiroaka': [5041.2, 4681.1, 4369.1, 4096.0, 4096.0, 4096.0], // 判別に使える(やや弱い)
  'ichimai_c|witch_shiroaka': [5461.3, 5461.3, 5041.2, 5041.2, 4681.1, 4681.1], // 判別に使える(やや弱い)

  // --- REG(赤赤青) ---
  // 単独/スイカA/1枚役A/1枚役Bは出典で「ほぼ変化なし」とのみ記載され具体値が無いため、
  // 他の非判別列と同じ1/16384.0を仮値として置いている(判別力を持たない前提なので影響は軽微)。
  'tanpin|reg_akaao': FLAT,
  'suika_a|reg_akaao': FLAT,
  'ichimai_a|reg_akaao': FLAT,
  'ichimai_b|reg_akaao': FLAT,
  'kyotsu_bell|reg_akaao': [4681.1, 4369.1, 4096.0, 3855.1, 3640.9, 3449.3], // 判別に使える
  'ichimai_c|reg_akaao': [3640.9, 3640.9, 3449.3, 3449.3, 3276.8, 3276.8], // 判別に使える
  'replay|reg_akaao': [13107.2, 10922.7, 9362.3, 8192.0, 7281.8, 6553.6], // 判別力が高い

  // --- REG(白白青) ---
  // 単独/共通ベル/スイカA/1枚役A/1枚役B/1枚役Cも同様に具体値が無いため仮値(1/16384.0)。
  'tanpin|reg_shiroao': FLAT,
  'kyotsu_bell|reg_shiroao': FLAT,
  'suika_a|reg_shiroao': FLAT,
  'ichimai_a|reg_shiroao': FLAT,
  'ichimai_b|reg_shiroao': FLAT,
  'ichimai_c|reg_shiroao': FLAT,
  'replay|reg_shiroao': [13107.2, 10922.7, 9362.3, 8192.0, 7281.8, 6553.6], // 判別力が高い
});

// 総ゲーム数×当選回数による判別用のカウントグループ(1/N。Nは分母)。
// BIG合算・REG合算は排他(同じゲームで同時には起こらない)なので、
// 残り(いずれにも当選しなかったゲーム)は自動的に計算される。
const counterGroups = [
  {
    id: 'bonus',
    label: 'ボーナス',
    unitLabel: '総ゲーム数',
    categories: counterCategoriesFromDenominatorTable(settings, {
      big: { label: 'BIG合算', denominators: [362.1, 350.5, 337.8, 327.7, 319.7, 313.6] },
      reg: { label: 'REG合算', denominators: [397.2, 390.1, 381.0, 374.5, 366.1, 360.1] },
    }),
  },
] satisfies Machine['counterGroups'];

// UIに表示する機種固有の注意点。
const notes = [
  'うみねこ2は完走型ARTのため、ART中に当選したボーナスは当選ゲーム数が分かりにくいことがあります。' +
    '本体オプションでWITCHランプを「一発告知」にしておくと当選した瞬間が分かるので、' +
    '当選ゲーム数を正確に記録でき判別精度が上がります。',
];

const referencePoints = [
  {
    title: 'ボーナス合算確率(BIG/REG)',
    body:
      '300〜400Gに1回起きるためサンプルが集まりやすく、判別の土台になる。設定差自体は' +
      '約1.15倍と緩やかだが、通常のプレイ時間でも十分な回数を観測できるのが強み。',
    table: {
      rows: [
        {
          label: 'BIG合算',
          valuesBySetting: {
            '1': '1/362.1', '2': '1/350.5', '3': '1/337.8',
            '4': '1/327.7', '5': '1/319.7', '6': '1/313.6',
          },
        },
        {
          label: 'REG合算',
          valuesBySetting: {
            '1': '1/397.2', '2': '1/390.1', '3': '1/381.0',
            '4': '1/374.5', '5': '1/366.1', '6': '1/360.1',
          },
        },
      ],
    },
  },
  {
    title: '判別力の高い契機×種別の組み合わせ',
    body:
      'ボーナスが「どの契機×種別で成立したか」は、ほとんどの組み合わせで全設定共通(1/16384.0)だが、' +
      '一部の組み合わせだけ設定差があり、判別ツールの契機×種別入力はここを拾っている。' +
      '最も判別力が高いのはWITCH赤赤白+確定役Aと黄金郷赤赤赤+1枚役C(いずれも設定1→6で約2.25倍)。',
    table: {
      rows: [
        {
          label: 'WITCH赤赤白+確定役A',
          valuesBySetting: {
            '1': '1/16384.0', '2': '1/13107.2', '3': '1/10922.7',
            '4': '1/9362.3', '5': '1/8192.0', '6': '1/7281.8',
          },
        },
        {
          label: '黄金郷赤赤赤+1枚役C',
          valuesBySetting: {
            '1': '1/16384.0', '2': '1/13107.2', '3': '1/10922.7',
            '4': '1/9362.3', '5': '1/8192.0', '6': '1/7281.8',
          },
        },
        {
          label: 'REG赤赤青+リプレイ',
          valuesBySetting: {
            '1': '1/13107.2', '2': '1/10922.7', '3': '1/9362.3',
            '4': '1/8192.0', '5': '1/7281.8', '6': '1/6553.6',
          },
        },
        {
          label: 'REG白白青+リプレイ',
          valuesBySetting: {
            '1': '1/13107.2', '2': '1/10922.7', '3': '1/9362.3',
            '4': '1/8192.0', '5': '1/7281.8', '6': '1/6553.6',
          },
        },
        {
          label: '黄金郷白白白+1枚役B',
          valuesBySetting: {
            '1': '1/7281.8', '2': '1/6553.6', '3': '1/5957.8',
            '4': '1/5461.3', '5': '1/5041.2', '6': '1/4681.1',
          },
        },
        {
          label: 'WITCH赤赤白+1枚役C',
          valuesBySetting: {
            '1': '1/5041.2', '2': '1/4681.1', '3': '1/4369.1',
            '4': '1/4096.0', '5': '1/3855.1', '6': '1/3640.9',
          },
        },
        {
          label: 'REG赤赤青+共通ベル',
          valuesBySetting: {
            '1': '1/4681.1', '2': '1/4369.1', '3': '1/4096.0',
            '4': '1/3855.1', '5': '1/3640.9', '6': '1/3449.3',
          },
        },
      ],
    },
  },
  {
    title: '運命分岐モード「即転落」時のボイス',
    body:
      'CZ「運命分岐モード」でART未突入のまま1回目の転落リプレイで即転落した際、' +
      'キャラクターボイスが発生し内容で設定を示唆する(出典1件のみで未クロス検証)。' +
      'レバーオンする前にPUSHボタンを押すと何度でも聞き直せる。' +
      '他にも、ステージチェンジ時のロゴ発光(小=奇数設定示唆、大=偶数設定示唆)がある。' +
      '出現確率(このボイス自体がどのくらいの頻度で発生するか)は公表されていない。',
    list: [
      { term: '秀吉「悪魔や！悪魔の仕業や！」', detail: 'デフォルト' },
      { term: '南條「残念だが、手の施しようがない…」', detail: '奇数設定示唆' },
      { term: '金蔵「おぉ～！！ベアトリーチェぇ～！！」', detail: '奇数設定示唆' },
      { term: '夏妃「もう…私を…許してッ…！」', detail: '偶数設定示唆' },
      { term: '楼座「私は何て、馬鹿なママだったの…！！」', detail: '偶数設定示唆' },
      { term: '縁寿「ここはあなたのいるべき世界じゃないわ」', detail: '設定2以上' },
      { term: 'ベアトリーチェ「あっひゃははははっ！！」', detail: '設定5以上' },
    ],
  },
  {
    title: 'ボーナス終了画面',
    body:
      '終了画面のパターンで設定を示唆する(2サイトでクロス確認済み)。' +
      '「戦人一家」以降の高設定示唆パターンはBB終了画面でのみ出現する。' +
      '各パターンの出現確率は公表されておらず、出たらラッキー程度の参考情報。',
    list: [
      { term: '都会(昼背景)', detail: '基本パターン' },
      { term: '縁寿ダイブ(夜背景+縁寿)', detail: '設定変更濃厚' },
      { term: '屋敷の正面玄関(ベアト見下ろし)', detail: '設定上げ濃厚' },
      { term: '戦人一家', detail: '設定2以上濃厚' },
      { term: 'ベアト・戦人①', detail: '設定2・4・6濃厚' },
      { term: 'ベアト・戦人②', detail: '設定4以上濃厚' },
      { term: 'ベアト・GM戦人①', detail: '設定5以上濃厚' },
      { term: 'ベアト・GM戦人②', detail: '設定6濃厚' },
    ],
  },
] satisfies Machine['referencePoints'];

export const umineko2: Machine = {
  id: 'umineko2',
  name: 'うみねこのなく頃に2',
  settings,
  triggers,
  types,
  outcomes,
  counterGroups,
  notes,
  referencePoints,
};
