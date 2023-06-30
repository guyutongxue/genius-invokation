import { EventHandlerCtor, ListenTarget } from "./events";

export type SupportType = "ally" | "item" | "place" | "other"

interface SupportInfo {
  type: SupportType;
  duration: number;
  usage: number;
  usagePerRound: number;
  listenTo: Exclude<ListenTarget, "master">;
  handlerCtor: EventHandlerCtor;
}
export type SupportInfoWithId = Readonly<SupportInfo & { id: number }>;

const allStatuses = new Map<number, SupportInfoWithId>();
export function registerSupport(id: number, info: SupportInfo) {
  allStatuses.set(id, { ...info, id });
}
export function getSupport(id: number) {
  if (!allStatuses.has(id)) {
    throw new Error(`Support ${id} not found`);
  }
  return allStatuses.get(id)!;
}
