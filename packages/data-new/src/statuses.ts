import { Context, DamageContext, SwitchActiveContext } from "./contexts";
import { EventHandlerCtor } from "./events";

export type StatusTag = "disableSkill";

interface StatusInfo {
  tags: StatusTag[];
  duration: number;
  usage: number;
  usagePerRound: number;
  listenToOthers: boolean;
  handlerCtor: EventHandlerCtor;
}

export type StatusInfoWithId = Readonly<StatusInfo & { id: number }>;

export interface StatusContext {
  readonly entityId: number;
  readonly info: StatusInfoWithId;
  getVisibleValue(): number | null;
}

const allStatuses = new Map<number, StatusInfoWithId>();
export function registerStatus(id: number, info: StatusInfo) {
  allStatuses.set(id, { ...info, id });
}
export function getStatus(id: number) {
  if (!allStatuses.has(id)) {
    throw new Error(`Status ${id} not found`);
  }
  return allStatuses.get(id)!;
}
