import { EventHandlerCtor } from "./events";

interface SummonInfo {
  usage: number;    // 释放时的可用次数
  maxUsage: number; // 最大叠加可用次数（几乎所有都=usage）
  handlerCtor: EventHandlerCtor;
}

export type SummonInfoWithId = Readonly<SummonInfo & { id: number }>;

export interface SummonContext {
  readonly entityId: number;
  readonly info: SummonInfoWithId;

  isMine(): boolean;
  usage: number;

  emitEndPhaseEffect(deduceUsage?: boolean): void;
  dispose(): void;
}


const allSummons = new Map<number, SummonInfoWithId>();
export function registerSummon(id: number, info: SummonInfo) {
  allSummons.set(id, {...info, id});
}
export function getSummon(id: number) {
  if (!allSummons.has(id)) {
    throw new Error(`Status ${id} not found`);
  }
  return allSummons.get(id)!;
}
