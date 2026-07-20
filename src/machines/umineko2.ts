import type { Machine } from '../engine/types';
import { outcomesFromPercentTable } from '../engine/authoring';

// =============================================================================
// うみねこのなく頃に2 設定判別データ
//
// ⚠️ 数値はすべて【プレースホルダー(要差し替え)】です。
//    実機のスペック値に置き換えてください。差し替えるのは基本的に下の
//    percent table(各行の6つの数字 = 設定1〜6 の%)だけでOKです。
//
// モデル: 「ボーナスを1回引いたとき、その内訳(契機×種別)がこの組み合わせに
//         なる割合(%)」。各設定(=各列)で合計100%になるようにします。
// =============================================================================

const settings = ['1', '2', '3', '4', '5', '6'];

// 当選契機。id は table のキーに使う。label は画面表示。
const triggers = [
  { id: 'tanpin', label: '単独' },
  { id: 'cherry_weak', label: '弱チェリー' },
  { id: 'cherry_strong', label: '強チェリー' },
  { id: 'suika', label: 'スイカ' },
  { id: 'chance', label: 'チャンス目' },
];

// ボーナス種別。
const types = [
  { id: 'big_red', label: '赤7BIG' },
  { id: 'big_blue', label: '青7BIG' },
  { id: 'reg', label: 'REG' },
];

// 契機×種別ごとの出現割合(%)。並びは settings(設定1〜6)の順。
// キーは "triggerId|typeId"。存在しない組み合わせは行を書かなければよい。
const outcomes = outcomesFromPercentTable(settings, {
  'tanpin|big_red': [20, 20, 19, 19, 18, 18],
  'tanpin|big_blue': [10, 11, 12, 13, 14, 16],
  'tanpin|reg': [8, 8, 8, 9, 9, 10],
  'cherry_weak|big_red': [9, 9, 9, 8, 8, 7],
  'cherry_weak|reg': [7, 7, 7, 7, 7, 7],
  'cherry_strong|big_red': [6, 6, 6, 6, 6, 6],
  'cherry_strong|big_blue': [6, 6, 6, 6, 6, 5],
  'suika|big_red': [10, 10, 10, 10, 10, 10],
  'suika|reg': [6, 6, 6, 6, 6, 6],
  'chance|big_blue': [8, 7, 7, 6, 6, 5],
  'chance|reg': [10, 10, 10, 10, 10, 10],
});

export const umineko2: Machine = {
  id: 'umineko2',
  name: 'うみねこのなく頃に2',
  settings,
  triggers,
  types,
  outcomes,
};
