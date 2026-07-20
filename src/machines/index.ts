import type { Machine } from '../engine/types';
import { umineko2 } from './umineko2';
import { starlight } from './starlight';

// 対応機種の登録簿。機種を増やすときはここに追加する。
export const machines: Machine[] = [umineko2, starlight];

export function getMachine(id: string): Machine | undefined {
  return machines.find((m) => m.id === id);
}
