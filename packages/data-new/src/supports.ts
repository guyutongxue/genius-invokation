import { EventHandlers } from "./events";

export type SupportType = "ally" | "item" | "place" | "other"

export interface SupportEventHandlers<T = {}> extends EventHandlers<T> {}

export interface SupportInfo {
  duration: number;
  usage: number;
  usagePerRound: number;
  listenToOpp: boolean;
  handlerCtor: new () => SupportEventHandlers;
}

const allStatuses = new Map<number, SupportInfo>();
export function registerSupport(id: number, info: SupportInfo) {
  allStatuses.set(id, info);
}
export function getSupport(id: number) {
  if (!allStatuses.has(id)) {
    throw new Error(`Support ${id} not found`);
  }
  return allStatuses.get(id)!;
}
