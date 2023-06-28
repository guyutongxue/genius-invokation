import { EventHandlerCtor } from "./events";

export type SupportType = "ally" | "item" | "place" | "other"


interface SupportInfo {
  type: SupportType;
  duration: number;
  usage: number;
  usagePerRound: number;
  listenToOpp: boolean;
  handlerCtor: EventHandlerCtor;
}
export type SupportInfoWithId = Readonly<SupportInfo & { id: number }>;

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
