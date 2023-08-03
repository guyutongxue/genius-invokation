import { SummonHandle } from "./builders";
import { EntityContext } from "./entities";
import { EventHandlerAndState } from "./events";

type SummonInfoNoId = Omit<SummonInfo, "id">;

export interface SummonInfo {
  readonly id: number;
  readonly usage: number;    // 释放时的可用次数
  readonly maxUsage: number; // 最大叠加可用次数（几乎所有都=usage）
  readonly disposeWhenUsedUp: boolean; // 是否在使用完毕后销毁
  readonly handler: EventHandlerAndState;
  readonly listenTo: "my" | "all";
}

export type SummonContext<Writable extends boolean> = EntityContext<SummonInfo, SummonHandle, "no", Writable>;

const allSummons = new Map<number, SummonInfo>();
export function registerSummon(id: number, info: SummonInfoNoId) {
  if (allSummons.has(id)) {
    throw new Error(`Summon ${id} already registered`);
  }
  allSummons.set(id, { ...info, id });
}
export function getSummon(id: number) {
  if (!allSummons.has(id)) {
    throw new Error(`Summon ${id} not found`);
  }
  return allSummons.get(id)!;
}
