import { DiceType } from "@gi-tcg/typings";
import {
  Context,
  SkillDescriptionContext,
  SwitchActiveContext,
} from "./contexts";
import { EventHandlerCtor, EventHandlers } from "./events";

export type UseSkillAction = (c: SkillDescriptionContext) => void | Promise<void>;

export interface NormalSkillInfo {
  type: "normal" | "elemental";
  gainEnergy: boolean;
  costs: DiceType[];
  action: UseSkillAction;
}

export interface BurstSkillInfo {
  type: "burst";
  gainEnergy: false;
  costs: DiceType[];
  action: UseSkillAction;
}

export interface PassiveSkillInfo {
  type: "passive";
  duration: number;
  usage: number;
  usagePerRound: number;
  handlerCtor: EventHandlerCtor;
}

export type SkillInfo =
  | NormalSkillInfo
  | BurstSkillInfo
  | PassiveSkillInfo;
export type SkillInfoWithId = Readonly<SkillInfo & { id: number; }>;

const allSkills = new Map<number, SkillInfoWithId>();
export function registerSkill(id: number, info: SkillInfo) {
  allSkills.set(id, { ...info, id });
}
export function getSkill(id: number) : SkillInfoWithId {
  if (!allSkills.has(id)) {
    throw new Error(`Skill ${id} not found`);
  }
  return allSkills.get(id)!;
}
