import { useOutletContext } from 'react-router-dom';
import type { OutletContext } from '../Layout';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { storageKeys, netCoins, type Session } from '../session';

export default function HistoryPage() {
  const { machine } = useOutletContext<OutletContext>();
  const [sessions, setSessions] = useLocalStorageState<Session[]>(
    storageKeys.sessions(machine.id),
    [],
  );

  const label = (kind: 'trigger' | 'type', id: string) => {
    const list = kind === 'trigger' ? machine.triggers : machine.types;
    return list.find((x) => x.id === id)?.label ?? id;
  };

  const removeSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const total = sessions.reduce((sum, s) => sum + netCoins(s), 0);

  if (sessions.length === 0) {
    return (
      <section className="history-page">
        <p className="hint">
          まだ保存されたセッションがありません。判別ツールで投資・回収を入力して
          「このセッションを履歴に保存」を押すとここに記録されます。
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="history-page">
        <div className="result-head">
          <h2>合計差枚</h2>
          <span className="count">{sessions.length} 件</span>
        </div>
        <p className={`net ${total >= 0 ? 'plus' : 'minus'}`}>
          {total >= 0 ? '+' : ''}
          {total}枚
        </p>
      </section>

      {sessions.map((s) => (
        <details className="session" key={s.id}>
          <summary>
            <span className="session-date">{s.date}</span>
            <span className={`net ${netCoins(s) >= 0 ? 'plus' : 'minus'}`}>
              {netCoins(s) >= 0 ? '+' : ''}
              {netCoins(s)}枚
            </span>
          </summary>
          <p className="desc">
            投資 {s.investment}枚 / 回収 {s.payout}枚 / ボーナス {s.observations.length}件
          </p>
          {s.observations.length > 0 && (
            <ol>
              {s.observations.map((o, i) => (
                <li key={i}>
                  {o.gameCount}G: {label('trigger', o.triggerId)} → {label('type', o.typeId)}
                </li>
              ))}
            </ol>
          )}
          <button className="reset" onClick={() => removeSession(s.id)}>
            この記録を削除
          </button>
        </details>
      ))}
    </>
  );
}
