import { useMemo, useState, type ReactNode } from 'react';
import { useOutletContext } from 'react-router-dom';
import { computePosterior, deriveCounterObservations } from '../engine/bayes';
import { validateMachine } from '../engine/authoring';
import type { CounterObservation, Observation, PosteriorEntry } from '../engine/types';
import type { OutletContext } from '../Layout';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { storageKeys, todayDateString, type Session } from '../session';

const EMPTY_COUNTER_GROUPS: NonNullable<OutletContext['machine']['counterGroups']> = [];

function PosteriorBars({ posterior }: { posterior: PosteriorEntry[] }) {
  const sorted = [...posterior].sort((a, b) => b.probability - a.probability);
  return (
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
  );
}

export default function ToolPage() {
  const { machine } = useOutletContext<OutletContext>();
  const hasEventFlow = machine.triggers.length > 0 && machine.types.length > 0;
  const counterGroups = machine.counterGroups ?? EMPTY_COUNTER_GROUPS;

  // 現在選択中の入力(まだ「追加」していないもの)。
  const [gameCount, setGameCount] = useState('');
  const [triggerId, setTriggerId] = useState(machine.triggers[0]?.id ?? '');
  const [typeId, setTypeId] = useState(machine.types[0]?.id ?? '');

  // これまでに観測したボーナス一覧(契機・種別・その時点の当選ゲーム数)。
  // リロードしても消えないよう localStorage に永続化する。
  const [observations, setObservations] = useLocalStorageState<Observation[]>(
    storageKeys.observations(machine.id),
    [],
  );

  // 今回のセッションの投資・回収(枚)。こちらも永続化する。
  const [investment, setInvestment] = useLocalStorageState(storageKeys.investment(machine.id), '');
  const [payout, setPayout] = useLocalStorageState(storageKeys.payout(machine.id), '');
  const [sessions, setSessions] = useLocalStorageState<Session[]>(
    storageKeys.sessions(machine.id),
    [],
  );

  // カウント評価は observations から自動算出する(契機×種別の category 経由)。
  const derivedCounterObservations = useMemo(
    () => deriveCounterObservations(machine, observations),
    [machine, observations],
  );

  const { posterior, skipped } = useMemo(
    () => computePosterior(machine, observations, { counterObservations: derivedCounterObservations }),
    [machine, observations, derivedCounterObservations],
  );

  // 設定推測(手入力): 各カウントグループごとに母数とカテゴリ別回数を直接入力する。
  // hasEventFlow が true の機種では詳細なボーナス記録とは別の「簡易」ツールとして、
  // false の機種(契機×種別の内訳が無い機種)ではこれが唯一の判別ツールになる。
  const [quickTrials, setQuickTrials] = useState<Record<string, string>>({});
  const [quickCounts, setQuickCounts] = useState<Record<string, Record<string, string>>>({});

  const quickCounterObservations = useMemo(() => {
    const list: CounterObservation[] = [];
    for (const group of counterGroups) {
      const trials = Number(quickTrials[group.id]) || 0;
      if (trials <= 0) continue;
      const counts: Record<string, number> = {};
      for (const category of group.categories) {
        counts[category.id] = Number(quickCounts[group.id]?.[category.id]) || 0;
      }
      list.push({ groupId: group.id, trials, counts });
    }
    return list;
  }, [quickTrials, quickCounts, counterGroups]);

  const overCountedGroupIds = counterGroups
    .filter((group) => {
      const trials = Number(quickTrials[group.id]) || 0;
      if (trials <= 0) return false;
      const sum = group.categories.reduce(
        (s, c) => s + (Number(quickCounts[group.id]?.[c.id]) || 0),
        0,
      );
      return sum > trials;
    })
    .map((g) => g.label);

  const quickPosterior = useMemo(
    () =>
      quickCounterObservations.length > 0
        ? computePosterior(machine, [], { counterObservations: quickCounterObservations })
        : null,
    [machine, quickCounterObservations],
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

  const investmentNum = Number(investment) || 0;
  const payoutNum = Number(payout) || 0;
  const netCoinsNow = payoutNum - investmentNum;
  const hasSessionData = observations.length > 0 || investment !== '' || payout !== '';

  const saveSession = () => {
    if (!hasSessionData) return;
    const session: Session = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: todayDateString(),
      investment: investmentNum,
      payout: payoutNum,
      observations,
    };
    setSessions((prev) => [session, ...prev]);
    setObservations([]);
    setInvestment('');
    setPayout('');
    setGameCount('');
  };

  const sorted = [...posterior].sort((a, b) => b.probability - a.probability);
  const topSetting = sorted[0];
  const quickTop = quickPosterior
    ? [...quickPosterior.posterior].sort((a, b) => b.probability - a.probability)[0]
    : null;

  const quickSection = counterGroups.length > 0 && (
    <QuickSection
      as={hasEventFlow ? 'details' : 'section'}
      title={hasEventFlow ? '簡易設定推測' : '設定推測'}
      showIndependentNote={hasEventFlow}
    >
      {counterGroups.map((group) => (
        <div className="quick-group" key={group.id}>
          <label className="quick-total">
            {group.label}({group.unitLabel})
            <input
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="例: 3000"
              value={quickTrials[group.id] ?? ''}
              onChange={(e) =>
                setQuickTrials((prev) => ({ ...prev, [group.id]: e.target.value }))
              }
            />
          </label>
          <div className="quick-counts">
            {group.categories.map((category) => (
              <label key={category.id}>
                {category.label}
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="0"
                  value={quickCounts[group.id]?.[category.id] ?? ''}
                  onChange={(e) =>
                    setQuickCounts((prev) => ({
                      ...prev,
                      [group.id]: { ...prev[group.id], [category.id]: e.target.value },
                    }))
                  }
                />
              </label>
            ))}
          </div>
        </div>
      ))}
      {overCountedGroupIds.length > 0 && (
        <p className="hint">
          ※ 当選回数の合計が母数を超えています({overCountedGroupIds.join('、')})。
        </p>
      )}
      {quickPosterior && quickTop ? (
        <>
          <p className="top">
            最有力: <strong>設定{quickTop.setting}</strong>（
            {(quickTop.probability * 100).toFixed(1)}%）
          </p>
          <PosteriorBars posterior={quickPosterior.posterior} />
        </>
      ) : (
        <p className="hint">母数を入力すると各設定の確率が出ます。</p>
      )}
    </QuickSection>
  );

  return (
    <>
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

      {hasEventFlow && (
        <>
          <section className="input">
            <label className="game-count">
              当選ゲーム数
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
                ※ 直近の記録({latestGameCount}G)より前の当選ゲーム数です。入力を確認してください。
              </p>
            )}
            {machine.notes?.map((note, i) => (
              <p key={i} className="hint tip">
                {note}
              </p>
            ))}
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
            <PosteriorBars posterior={posterior} />
            {derivedCounterObservations.map((obs) => {
              const group = counterGroups.find((g) => g.id === obs.groupId);
              if (!group) return null;
              return (
                <p className="hint" key={obs.groupId}>
                  {group.label}評価: {obs.trials}
                  {group.unitLabel}中
                  {group.categories
                    .map((c) => `${c.label}${obs.counts[c.id] ?? 0}回`)
                    .join(' / ')}
                </p>
              );
            })}
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
        </>
      )}

      <section className="coins">
        <h2>投資・回収</h2>
        <div className="row">
          <label>
            投資(枚)
            <input
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="例: 500"
              value={investment}
              onChange={(e) => setInvestment(e.target.value)}
            />
          </label>
          <label>
            回収(枚)
            <input
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="例: 800"
              value={payout}
              onChange={(e) => setPayout(e.target.value)}
            />
          </label>
        </div>
        <p className={`net ${netCoinsNow >= 0 ? 'plus' : 'minus'}`}>
          差枚: {netCoinsNow >= 0 ? '+' : ''}
          {netCoinsNow}枚
        </p>
        <button className="save-session" onClick={saveSession} disabled={!hasSessionData}>
          このセッションを履歴に保存
        </button>
        <p className="hint">
          保存すると投資・回収・ボーナス記録が「履歴」に残り、現在の入力はリセットされます。
          {sessions.length > 0 && ` (保存済み ${sessions.length} 件)`}
        </p>
      </section>

      {quickSection}
    </>
  );
}

function QuickSection({
  as,
  title,
  showIndependentNote,
  children,
}: {
  as: 'details' | 'section';
  title: string;
  showIndependentNote: boolean;
  children: ReactNode;
}) {
  const desc = showIndependentNote
    ? 'ボーナスを1件ずつ記録しなくても、母数とカテゴリ別の回数だけで大まかに判定できます。' +
      '上の詳細な記録とは別の、独立した簡易ツールです。複数の要素を入力すれば、それぞれの' +
      '判別根拠が合算されて1つの結果になります。'
    : '各判別要素の母数とカテゴリ別の回数を入力してください。複数入力すれば、それぞれの' +
      '判別根拠が合算されて1つの結果になります。';

  if (as === 'details') {
    return (
      <details className="quick">
        <summary>{title}</summary>
        <p className="desc">{desc}</p>
        {children}
      </details>
    );
  }
  return (
    <section className="quick">
      <h2>{title}</h2>
      <p className="desc">{desc}</p>
      {children}
    </section>
  );
}
