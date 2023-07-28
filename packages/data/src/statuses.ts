import { SkillHandle, StatusHandle } from "./builders";
import { EntityContext } from "./entities";
import { EventHandlerAndState, ListenTarget } from "./events";

export type StatusTag =
  | "disableSkill" // 禁用技能（仅角色状态）
  | "shield"       // 护盾
  ;

export type ShieldConfig = null | {
  initial: number;
  recreateMax: number;
}

export type PrepareConfig = null | {
  skillOrStatus: SkillHandle | StatusHandle;
  round: number;
}

type StatusInfoNoId = Omit<StatusInfo, "id">;

export interface StatusInfo {
  readonly id: number;
  readonly tags: StatusTag[];
  readonly duration: number;
  readonly usage: number;
  readonly maxUsage: number; // 最大叠加可用次数（几乎所有都=usage）
  readonly usagePerRound: number;
  readonly listenTo: ListenTarget;
  readonly shield: ShieldConfig;
  readonly prepare: PrepareConfig;
  readonly handler: EventHandlerAndState;
}

export type StatusContext<Writable extends boolean> = EntityContext<StatusInfo, StatusHandle, "possible", Writable>;

const allStatuses = new Map<number, StatusInfo>();
export function registerStatus(id: number, info: StatusInfoNoId) {
  allStatuses.set(id, { ...info, id });
}
export function getStatus(id: number) {
  if (!allStatuses.has(id)) {
    throw new Error(`Status ${id} not found`);
  }
  return allStatuses.get(id)!;
}

export const SHIELD_VALUE: unique symbol = Symbol("shieldValue");
