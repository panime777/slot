import type { Machine } from '../engine/types';
import { outcomesFromPercentTable } from '../engine/authoring';

// =============================================================================
// 少女☆歌劇 レヴュースタァライト 設定判別データ
//
// ⚠️ 数値はすべて【プレースホルダー(要差し替え)】です。うみねこ2導入時と同様、
//    実機のスペック値が分かり次第、下の percent table(各行の6数字 = 設定1〜6 の%)を
//    差し替えてください。BIG/REG合算のデータが手に入れば bonusRates も追加できます
//    (umineko2.ts を参照)。追加手順は CLAUDE.md の「新しい機種を追加する手順」参照。
// =============================================================================

const settings = ['1', '2', '3', '4', '5', '6'];

// 当選契機。id は table のキーに使う。label は画面表示。
const triggers = [
  { id: 'tanpin', label: '単独' },
  { id: 'cherry', label: 'チェリー' },
  { id: 'suika', label: 'スイカ' },
  { id: 'chance', label: 'チャンス目' },
];

// ボーナス種別。
const types = [
  { id: 'big', label: 'BIG' },
  { id: 'reg', label: 'REG' },
];

// 契機×種別ごとの出現割合(%)。並びは settings(設定1〜6)の順。
const outcomes = outcomesFromPercentTable(settings, {
  'tanpin|big': [25, 25, 24, 24, 23, 23],
  'tanpin|reg': [15, 15, 15, 14, 14, 13],
  'cherry|big': [15, 15, 16, 16, 17, 18],
  'suika|big': [15, 15, 15, 15, 15, 15],
  'suika|reg': [10, 10, 10, 11, 11, 11],
  'chance|reg': [20, 20, 20, 20, 20, 20],
});

export const starlight: Machine = {
  id: 'starlight',
  name: '少女☆歌劇 レヴュースタァライト',
  settings,
  triggers,
  types,
  outcomes,
};
