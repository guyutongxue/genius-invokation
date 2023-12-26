import { DiceType } from "@gi-tcg/typings";
import { ElementalReactionContext, DamageReadonlyContext } from "./contexts";
import { EventHandlerAndState, ListenTarget } from "./events";
import { CardHandle, SkillHandle, StatusHandle } from "./builders";
import { CharacterContext } from "./characters";
import { PlayCardContext } from "./cards";
import { StatusContext } from "./statuses";
import { Context } from "./global";
import { EntityContext } from ".";

export type UseSkillAction = (c: Context<object, SkillContext<true>, true>) => void | Promise<void>;

export interface SkillContext<Writable extends boolean = false> {
  readonly id: SkillHandle;
  readonly info: SkillInfo;
  triggeredByCard(card: CardHandle): PlayCardContext | null;
  triggeredByStatus(status: StatusHandle): StatusContext<Writable> | null;
  readonly character: CharacterContext<Writable>;
  readonly target: CharacterContext<Writable>;
  readonly charged: boolean;  // 重击
  readonly plunging: boolean; // 下落攻击

  // 坚定之岩
  readonly damages: DamageReadonlyContext[];

  // 常九爷、参量质变仪：读取此次技能连带造成的所有伤害/元素反应
  getAllDescendingDamages(): DamageReadonlyContext[];
  getAllDescendingReactions(): ElementalReactionContext[];
}

export interface NormalSkillInfo {
  readonly id: number;
  readonly hidden: boolean;
  readonly type: "normal" | "elemental" | "burst";
  readonly gainEnergy: boolean;
  readonly costs: DiceType[];
  readonly action: UseSkillAction;
}

export interface PassiveSkillInfo {
  readonly id: number;
  readonly type: "passive";
  readonly listenTo: ListenTarget;
  readonly usagePerRound: number;
  readonly handler: EventHandlerAndState;
}

export type PassiveSkillContext<Writable extends boolean> = EntityContext<PassiveSkillInfo, SkillHandle, "yes", Writable>;

export type SkillInfo = NormalSkillInfo | PassiveSkillInfo;

export type SkillType = SkillInfo["type"];

type SkillInfoNoId = Omit<NormalSkillInfo, "id"> | Omit<PassiveSkillInfo, "id">;

const allSkills = new Map<number, SkillInfo>();
export function registerSkill(id: number, info: SkillInfoNoId) {
  if (allSkills.has(id)) {
    throw new Error(`Skill ${id} already registered`);
  }
  allSkills.set(id, { ...info, id });
}
export function getSkill(id: number): SkillInfo {
  if (!allSkills.has(id)) {
    throw new Error(`Skill ${id} not found`);
  }
  return allSkills.get(id)!;
}
