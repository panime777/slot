import { useMemo, useState } from 'react';
import { computePosterior, deriveSpinTally } from './engine/bayes';
import { validateMachine } from './engine/authoring';
import type { Observation } from './engine/types';
import { machines, getMachine } from './machines';
import './App.css';

export default function App() {
  const [machineId, setMachineId] = useState(machines[0].id);
  const machine = getMachine(machineId)!;

  // 現在選択中の入力(まだ「追加」していないもの)。
  const [gameCount, setGameCount] = useState('');
  const [triggerId, setTriggerId] = useState(machine.triggers[0].id);
  const [typeId, setTypeId] = useState(machine.types[0].id);

  // これまでに観測したボーナス一覧(契機・種別・その時点の総ゲーム数)。
  const [observations, setObservations] = useState<Observation[]>([]);

  // 総ゲーム数評価は observations から自動算出する(手入力の集計欄は持たない)。
  const spinTally = useMemo(
    () => deriveSpinTally(machine, observations),
    [machine, observations],
  );

  const { posterior, skipped } = useMemo(
    () => computePosterior(machine, observations, { spinTally }),
    [machine, observations, spinTally],
  );

  // 開発時のみデータ健全性を警告。
  const warnings = useMemo(() => validateMachine(machine), [machine]);

  const label = (kind: 'trigger' | 'type', id: string) => {
    const list = kind === 'trigger' ? machine.triggers : machine.types;
    return list.find((x) => x.id === id)?.label ?? id;
  };

  const gameCountNum = Number(gameCount);
  const canAdd = gameCountNum > 0;
  const latestGameCount = observations.length > 0
    ? Math.max(...observations.map((o) => o.gameCount))
    : 0;
  const gameCountOutOfOrder = canAdd && gameCountNum <= latestGameCount;

  const addObservation = () => {
    if (!canAdd) return;
    setObservations((prev) => [...prev, { triggerId, typeId, gameCount: gameCountNum }]);
    setGameCount('');
  };

  const removeObservation = (i: number) => {
    setObservations((prev) => prev.filter((_, idx) => idx !== i));
  };

  const reset = () => setObservations([]);

  const sorted = [...posterior].sort((a, b) => b.probability - a.probability);
  const topSetting = sorted[0];

  return (
    <div className="app">
      <header>
        <h1>設定判別ツール</h1>
        <select
          value={machineId}
          onChange={(e) => {
            const m = getMachine(e.target.value)!;
            setMachineId(m.id);
            setGameCount('');
            setTriggerId(m.triggers[0].id);
            setTypeId(m.types[0].id);
            setObservations([]);
          }}
        >
          {machines.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </header>

      {import.meta.env.DEV && warnings.length > 0 && (
        <div className="warn">
          データ警告(開発時のみ表示):
          <ul>
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="input">
        <label className="game-count">
          総ゲーム数(このボーナス成立時点)
          <input
            type="number"
            min="1"
            inputMode="numeric"
            placeholder="例: 1520"
            value={gameCount}
            onChange={(e) => setGameCount(e.target.value)}
          />
        </label>
        <div className="row">
          <label>
            契機
            <select value={triggerId} onChange={(e) => setTriggerId(e.target.value)}>
              {machine.triggers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            種別
            <select value={typeId} onChange={(e) => setTypeId(e.target.value)}>
              {machine.types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button className="add" onClick={addObservation} disabled={!canAdd}>
          ＋ ボーナスを追加
        </button>
        {gameCountOutOfOrder && (
          <p className="hint">
            ※ 直近の記録({latestGameCount}G)より前のゲーム数です。入力を確認してください。
          </p>
        )}
        {machine.bonusRates && machine.bonusRates.length > 0 && (
          <p className="hint tip">
            うみねこ2は完走型ARTのため、ART中に当選したボーナスは総ゲーム数が分かりにくいことがあります。
            本体オプションでWITCHランプを「一発告知」にしておくと当選した瞬間が分かるので、
            総ゲーム数を正確に記録でき判別精度が上がります。
          </p>
        )}
      </section>

      <section className="result">
        <div className="result-head">
          <h2>設定判別</h2>
          <span className="count">{observations.length} 件</span>
        </div>
        {observations.length === 0 ? (
          <p className="hint">ボーナスを追加すると各設定の確率が出ます。</p>
        ) : (
          <p className="top">
            最有力: <strong>設定{topSetting.setting}</strong>（
            {(topSetting.probability * 100).toFixed(1)}%）
          </p>
        )}
        <ul className="bars">
          {sorted.map((e) => (
            <li key={e.setting}>
              <span className="s-label">設定{e.setting}</span>
              <span className="bar-track">
                <span
                  className="bar-fill"
                  style={{ width: `${(e.probability * 100).toFixed(1)}%` }}
                />
              </span>
              <span className="s-pct">{(e.probability * 100).toFixed(1)}%</span>
            </li>
          ))}
        </ul>
        {spinTally && (
          <p className="hint">
            総ゲーム数評価: {spinTally.totalSpins}G中
            {(machine.bonusRates ?? [])
              .map((r) => `${r.label}${spinTally.counts[r.id] ?? 0}回`)
              .join(' / ')}
          </p>
        )}
        {skipped.length > 0 && (
          <p className="hint">
            ※ データ未登録の組み合わせが {skipped.length} 件あり、計算から除外されました。
          </p>
        )}
      </section>

      <section className="history">
        <div className="result-head">
          <h2>入力履歴</h2>
          {observations.length > 0 && (
            <button className="reset" onClick={reset}>
              全消去
            </button>
          )}
        </div>
        <ol>
          {observations.map((o, i) => (
            <li key={i}>
              <span>
                {o.gameCount}G: {label('trigger', o.triggerId)} → {label('type', o.typeId)}
              </span>
              <button onClick={() => removeObservation(i)}>×</button>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
