import { DamageContext, SkillContext, SwitchActiveContext } from "./contexts";
import { EventHandlers, HandlerResult } from "./events";

export interface StatusEventHandlers<This = {}> extends EventHandlers<This> {
  onSwitchActiveFrom?(this: This, c: SwitchActiveContext): HandlerResult;
  onBeforeDealDamage?(this: This, c: DamageContext): HandlerResult;
}

export type StatusTag = "disableSkill";

interface StatusInfo {
  tags: StatusTag[];
  duration: number;
  usage: number;
  usagePerRound: number;
  listenToOthers: boolean;
  handlerCtor: new () => StatusEventHandlers;
}

export type StatusInfoWithId = Readonly<StatusInfo & { id: number }>;

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
