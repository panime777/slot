import type { Observation } from './engine/types';

/**
 * 1回の実戦セッション(投資・回収・ボーナス記録のひとまとまり)。
 * 判別ロジックには使わない、ユーザー自身の実戦記録。機種ごとに localStorage に保存する。
 */
export interface Session {
  id: string;
  /** セッションを保存した日付(YYYY-MM-DD)。 */
  date: string;
  /** 投資枚数。 */
  investment: number;
  /** 回収枚数。 */
  payout: number;
  /** このセッション中に記録したボーナス。 */
  observations: Observation[];
}

/** 差枚(回収 - 投資)。 */
export function netCoins(session: Pick<Session, 'investment' | 'payout'>): number {
  return session.payout - session.investment;
}

export function todayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** localStorage キーを機種ごとに一意にするためのヘルパー(表記ゆれ防止)。 */
export const storageKeys = {
  observations: (machineId: string) => `slot:${machineId}:observations`,
  investment: (machineId: string) => `slot:${machineId}:investment`,
  payout: (machineId: string) => `slot:${machineId}:payout`,
  sessions: (machineId: string) => `slot:${machineId}:sessions`,
};
