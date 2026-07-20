import type { BonusRate, Machine, Outcome, SettingId } from './types';

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
 * 実機スペックでよくある「1/N」表記の生データから Outcome[] を作る。
 * 各行を "triggerId|typeId": [N設定1, N設定2, ...] で渡す(N=分母。null/undefinedはその設定では
 * 起こらない=対象外として扱う)。生成される確率は「(ボーナス種別を問わず)全 Outcome の中で
 * この組み合わせが占める割合」になるよう、設定ごとに自動で正規化(合計1に)される。
 * そのため各行の値は 1/N をそのまま入れればよく、事前に%へ換算する必要はない。
 *
 * 例:
 *   outcomesFromDenominatorTable(['1','2','3','4','5','6'], {
 *     'tanpin|big_red': [362.1, 350.5, 337.8, 327.7, 319.7, 313.6],
 *   })
 */
export function outcomesFromDenominatorTable(
  settings: SettingId[],
  table: Record<string, Array<number | null>>,
): Outcome[] {
  const rows: { triggerId: string; typeId: string; raw: Record<SettingId, number> }[] = [];

  for (const [key, row] of Object.entries(table)) {
    const [triggerId, typeId] = key.split('|');
    if (!triggerId || !typeId) {
      throw new Error(`outcomesFromDenominatorTable: キー "${key}" は "triggerId|typeId" 形式にしてください`);
    }
    if (row.length !== settings.length) {
      throw new Error(
        `outcomesFromDenominatorTable: キー "${key}" の値は ${settings.length} 個必要です(${row.length} 個でした)`,
      );
    }
    const raw: Record<SettingId, number> = {};
    settings.forEach((s, i) => {
      const n = row[i];
      raw[s] = n == null ? 0 : 1 / n;
    });
    rows.push({ triggerId, typeId, raw });
  }

  // 設定ごとに正規化(全 outcome の合計を1にする)。
  const totalBySetting: Record<SettingId, number> = {};
  for (const s of settings) {
    totalBySetting[s] = rows.reduce((sum, r) => sum + r.raw[s], 0);
  }

  return rows.map((r) => {
    const probBySetting: Record<SettingId, number> = {};
    for (const s of settings) {
      probBySetting[s] = totalBySetting[s] > 0 ? r.raw[s] / totalBySetting[s] : 0;
    }
    return { triggerId: r.triggerId, typeId: r.typeId, probBySetting };
  });
}

/**
 * 総ゲーム数×当選回数による判別(spinTally)用の BonusRate[] を、
 * 「1/N」表記(N=分母)の表から作る。カテゴリ同士は排他(同じゲームで同時に起こらない)想定。
 *
 * 例:
 *   bonusRatesFromDenominatorTable(['1','2','3','4','5','6'], {
 *     big: { label: 'BIG合算', denominators: [362.1, 350.5, 337.8, 327.7, 319.7, 313.6] },
 *   })
 */
export function bonusRatesFromDenominatorTable(
  settings: SettingId[],
  table: Record<string, { label: string; denominators: number[] }>,
): BonusRate[] {
  return Object.entries(table).map(([id, { label, denominators }]) => {
    if (denominators.length !== settings.length) {
      throw new Error(
        `bonusRatesFromDenominatorTable: "${id}" の値は ${settings.length} 個必要です(${denominators.length} 個でした)`,
      );
    }
    const probBySetting: Record<SettingId, number> = {};
    settings.forEach((s, i) => {
      probBySetting[s] = 1 / denominators[i];
    });
    return { id, label, probBySetting };
  });
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
