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

/** 1機種の判別に必要なデータ一式。 */
export interface Machine {
  id: string;
  name: string;
  settings: SettingId[];
  triggers: Trigger[];
  types: BonusType[];
  outcomes: Outcome[];
}

/** ユーザーが観測した1回のボーナス。 */
export interface Observation {
  triggerId: string;
  typeId: string;
}

/** 判別結果1件(1設定ぶんの事後確率)。 */
export interface PosteriorEntry {
  setting: SettingId;
  /** 事後確率(0〜1)。全設定で合計1。 */
  probability: number;
}
