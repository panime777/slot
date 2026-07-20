// 機種非依存の設定判別エンジンの型定義。
// ここには「うみねこ2」固有の情報は一切入れず、どの機種でも使える抽象だけを置く。

/** 設定の識別子。多くの機種は "1"〜"6" だが、機種によっては設定数が異なるため文字列で持つ。 */
export type SettingId = string;

/** ボーナスの当選契機(例: 単独, 弱チェリー, スイカ ...)。 */
export interface Trigger {
  id: string;
  label: string;
}

/** ボーナスの種別(例: 赤7BIG, 青7BIG, REG ...)。 */
export interface BonusType {
  id: string;
  label: string;
  /**
   * この種別が属する CounterCategory.id(例: 'big' / 'reg')。設定されていれば、
   * この種別の観測を自動的にカウント評価(CounterObservation)の当選回数として数える。
   */
  category?: string;
}

/**
 * 「ボーナスを1回引いたとき、その内訳(契機×種別)がこの組み合わせになる確率」を
 * 設定ごとに持つ。各設定について、全 Outcome の probBySetting を足すと 1 になる想定。
 * 実在しない組み合わせ(その契機からその種別は出ない等)は定義しなければよい。
 */
export interface Outcome {
  triggerId: string;
  typeId: string;
  /** 設定ID -> 条件付き確率(0〜1)。 */
  probBySetting: Record<SettingId, number>;
}

/**
 * 「1試行あたりこのカテゴリに当選する確率」を設定ごとに持つ。
 * 同じ CounterGroup 内のカテゴリ同士は排他(同じ試行で同時に起こらない)を想定。
 * 例: BIG・REGのように、カテゴリ同士は排他だが「何にも当選しない試行」もあり得る。
 */
export interface CounterCategory {
  id: string;
  label: string;
  /** 設定ID -> 1試行あたりの当選確率(0〜1)。 */
  probBySetting: Record<SettingId, number>;
}

/**
 * 契機×種別の内訳とは独立な、カウントベースの証拠源1つのまとまり。
 * 「ボーナス合算」「5枚役」「激走チャージ後のセリフ」のように、母数の単位が異なる
 * 複数の独立した証拠源を機種ごとに好きなだけ持てる。グループ同士は互いに独立(同時に
 * 起こり得る)とみなし、それぞれ別の多項分布として評価した対数尤度を合算する。
 */
export interface CounterGroup {
  id: string;
  label: string;
  /** 母数の単位(例: "総ゲーム数", "激走チャージ回数")。UIの入力欄ラベルに使う。 */
  unitLabel: string;
  /** グループ内で排他なカテゴリ一覧。 */
  categories: CounterCategory[];
}

/** 「Nこの母数のうち、カテゴリごとに何回当選したか」の集計入力(特定の CounterGroup に対応)。 */
export interface CounterObservation {
  groupId: string;
  trials: number;
  /** カテゴリID(CounterCategory.id) -> 当選回数。 */
  counts: Record<string, number>;
}

/**
 * 「設定差ポイント」ページに表示する参考情報1項目。判別計算には使わず、
 * 読み物として設定判別要素をまとめるためのデータ。table は任意(数値表が無い注記だけの項目もある)。
 */
export interface ReferencePoint {
  title: string;
  body: string;
  table?: {
    /** 設定ID -> 表示用の文字列(例: "1/265.9")。 */
    rows: { label: string; valuesBySetting: Record<SettingId, string> }[];
  };
  /**
   * 「パターン → 示唆内容」のような、設定列を持たない対応一覧(ボイス・演出の台詞と
   * 示唆内容など)。table が設定1〜6の数値比較に向くのに対し、list はカテゴリ的な
   * 一覧を読みやすく出すためのもの。
   */
  list?: { term: string; detail: string }[];
}

/** 1機種の判別に必要なデータ一式。 */
export interface Machine {
  id: string;
  name: string;
  settings: SettingId[];
  triggers: Trigger[];
  types: BonusType[];
  outcomes: Outcome[];
  /** カウントベースの証拠源(任意)。複数持てる(例: ボーナス合算、5枚役、激走チャージ後セリフ)。 */
  counterGroups?: CounterGroup[];
  /** UIに表示する機種固有の注意点(任意)。例: ARTの区切り方によるゲーム数記録のコツなど。 */
  notes?: string[];
  /** 「設定差ポイント」ページに表示する参考情報(任意)。判別計算には使わない読み物データ。 */
  referencePoints?: ReferencePoint[];
}

/** ユーザーが観測した1回のボーナス。 */
export interface Observation {
  triggerId: string;
  typeId: string;
  /** このボーナスが成立した時点での総ゲーム数。総ゲーム数評価の自動算出に使う。 */
  gameCount: number;
}

/** 判別結果1件(1設定ぶんの事後確率)。 */
export interface PosteriorEntry {
  setting: SettingId;
  /** 事後確率(0〜1)。全設定で合計1。 */
  probability: number;
}
