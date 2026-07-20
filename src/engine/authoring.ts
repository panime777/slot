import type { Machine, Outcome, SettingId } from './types';

/**
 * データを「表」として書くための補助。
 * 各行を "triggerId|typeId": [設定1, 設定2, ...] の形(%表記)で渡すと Outcome[] を作る。
 * 配列の並びは settings の順に対応させること。
 *
 * 例:
 *   outcomesFromPercentTable(['1','2','3','4','5','6'], {
 *     'tanpin|big_red': [12, 12, 13, 13, 14, 15],
 *   })
 */
export function outcomesFromPercentTable(
  settings: SettingId[],
  table: Record<string, number[]>,
): Outcome[] {
  const outcomes: Outcome[] = [];
  for (const [key, row] of Object.entries(table)) {
    const [triggerId, typeId] = key.split('|');
    if (!triggerId || !typeId) {
      throw new Error(`outcomesFromPercentTable: キー "${key}" は "triggerId|typeId" 形式にしてください`);
    }
    if (row.length !== settings.length) {
      throw new Error(
        `outcomesFromPercentTable: キー "${key}" の値は ${settings.length} 個必要です(${row.length} 個でした)`,
      );
    }
    const probBySetting: Record<SettingId, number> = {};
    settings.forEach((s, i) => {
      probBySetting[s] = row[i] / 100; // % → 確率
    });
    outcomes.push({ triggerId, typeId, probBySetting });
  }
  return outcomes;
}

/**
 * データの健全性チェック(開発時用)。
 * 各設定について、全 Outcome の確率合計が 1 に近いかを見る。
 * 「ボーナス1回あたりの内訳」モデルなので、合計は設定ごとに 1 になるのが正しい。
 */
export function validateMachine(machine: Machine): string[] {
  const warnings: string[] = [];
  for (const s of machine.settings) {
    let sum = 0;
    for (const o of machine.outcomes) sum += o.probBySetting[s] ?? 0;
    if (Math.abs(sum - 1) > 0.02) {
      warnings.push(`設定${s}: 確率合計が ${(sum * 100).toFixed(1)}%(100%であるべき)`);
    }
  }
  return warnings;
}
