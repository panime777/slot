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
   * この種別が属する BonusRate.id(例: 'big' / 'reg')。設定されていれば、
   * この種別の観測を自動的に総ゲーム数評価(SpinTally)のカテゴリ当選回数として数える。
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
 * 「1ゲームあたりこのカテゴリに当選する確率」を設定ごとに持つ。
 * 契機×種別の内訳とは独立な、第二の証拠源(総ゲーム数と当選回数)に使う。
 * 例: BIG合算・REG合算のように、カテゴリ同士は排他(同じゲームで同時に起こらない)を想定。
 */
export interface BonusRate {
  id: string;
  label: string;
  /** 設定ID -> 1ゲームあたりの当選確率(0〜1)。 */
  probBySetting: Record<SettingId, number>;
}

/** 「Nゲーム回して、カテゴリごとに何回当選したか」の集計入力。 */
export interface SpinTally {
  totalSpins: number;
  /** カテゴリID(BonusRate.id) -> 当選回数。 */
  counts: Record<string, number>;
}

/** 1機種の判別に必要なデータ一式。 */
export interface Machine {
  id: string;
  name: string;
  settings: SettingId[];
  triggers: Trigger[];
  types: BonusType[];
  outcomes: Outcome[];
  /** 総ゲーム数×当選回数による判別に使うカテゴリ別確率(任意)。 */
  bonusRates?: BonusRate[];
  /** UIに表示する機種固有の注意点(任意)。例: ARTの区切り方によるゲーム数記録のコツなど。 */
  notes?: string[];
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
