import { useEffect, useState } from 'react';

/**
 * useState と同じ感覚で使えて、値の変更を自動的に localStorage に保存する。
 * リロードしても状態が消えないようにするための汎用フック。
 *
 * key はコンポーネントのマウント中に変わらない前提(機種切り替えなどキーが変わる場合は
 * 呼び出し側のコンポーネントごと remount させること。Layout の `<Outlet key={machine.id}>` 参照)。
 */
export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw != null ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ストレージ容量超過などは無視(致命的ではないため)。
    }
  }, [key, state]);

  return [state, setState];
}
