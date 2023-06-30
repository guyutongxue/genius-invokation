import { SkillHandle } from "./builders";
import { Context, DamageContext, SwitchActiveContext } from "./contexts";
import { EventHandlerCtor, ListenTarget } from "./events";

export type StatusTag = "disableSkill" | "shield";

export type ShieldConfig = null | number | {
  initial: number;
  recreateMax: number;
}

export type PrepareConfig = null | {
  skill: SkillHandle,
  round: number,
}

interface StatusInfo {
  tags: StatusTag[];
  duration: number;
  usage: number;
  shield: ShieldConfig;
  usagePerRound: number;
  listenTo: ListenTarget;
  handlerCtor: EventHandlerCtor;
}

export type StatusInfoWithId = Readonly<StatusInfo & { id: number }>;

export interface StatusContext {
  readonly entityId: number;
  readonly info: StatusInfoWithId;
  getVisibleValue(): number | null;
  addVisibleValue(value: number): number;
  
  gainUsage(value: number): void;
  gainShield(value: number): void;
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
