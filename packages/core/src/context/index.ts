import { Aura, CharacterFacade, DamageType, DiceType } from "@jenshin-tcg/typings";
import { Character } from "../character";

export interface CharacterInfo {
  readonly health: number;
  readonly energy: number;
  modifiers?: unknown[];
}

export type SkillType = "normal" | "skill" | "burst";

export interface SkillInfo {
  name: string;
  type: SkillType;
  costs: Record<DiceType, number>;
}

export enum DamageTarget {
  ACTIVE,
  STANDBY,
}

export interface DescriptionContext {
  damage(value: number, type: DamageType, target?: DamageTarget): void;
  createStatus(status: IStatusConstructor): void;
  createCombatStatus(status: IStatusConstructor, opposite?: boolean): void;
  summon(summon: unknown): void;
}

export interface IStatus {
  onBeforeUseSkill?: (c: SkillContext) => SkillContext;
  onUseSkill?: (c: SkillContext) => void;
  // onBeforeUseDice?: (c: DiceContext) => DiceContext;
}

export interface SkillContext {
  character: Character;
  info: SkillInfo;
  additionalDamage: number;
}

interface IStatusConstructor {
  new (): IStatus;
}
