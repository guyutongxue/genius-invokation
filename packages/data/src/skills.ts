import { DiceType } from "@gi-tcg/typings";
import {
  Context,
  SkillDescriptionContext,
  SwitchActiveContext,
} from "./contexts";
import { EventHandlerCtor, EventHandlers } from "./events";

export type UseSkillAction = (c: SkillDescriptionContext) => void | Promise<void>;

export interface NormalSkillInfo {
  type: "normal" | "elemental" | "burst";
  gainEnergy: boolean;
  costs: DiceType[];
  action: UseSkillAction;
}

export interface PassiveSkillInfo {
  type: "passive";
  duration: number;
  // usage: number;
  usagePerRound: number;
  handlerCtor: EventHandlerCtor;
}

export type SkillInfo =
  | NormalSkillInfo
  | PassiveSkillInfo;

export type SkillType = SkillInfo["type"];

export type SkillInfoWithId = Readonly<SkillInfo & { id: number; }>;
export type PassiveSkillInfoWithId = Readonly<PassiveSkillInfo & { id: number; }>;

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
