import { DiceType, DamageType } from "@jenshin-tcg/typings";
import { ICharacter } from "./interfaces/character";
import { SkillInfo } from "./interfaces/skill";
import { IStatus } from "./interfaces/status";
import { ICard } from ".";

export enum Target {
  ACTIVE, // 我方出战角色
  STANDBY, // 我方后台角色
  OPP_ACTIVE, // 对方出战角色
  OPP_STANDBY, // 对方后台角色
  MASTER, // （状态）所在角色
  MASTER_ACTIVE, // （状态）所在阵营出战角色
  MASTER_STANDBY, // （状态）所在阵营后台角色
}

export enum SwitchTarget {
  NEXT,
  PREV,
  MANUAL,
  OPP_NEXT,
  OPP_PREV,
  OPP_MANUAL
}

export interface Context {
  readonly currentPhase: "action" | "end";
  readonly currentTurn: number;
  isMyTurn(): boolean;

  damage(value: number, type: DamageType, target?: Target): void;
  heal(value: number, target?: Target): void;
  gainEnergy(value?: number, target?: Target): void;

  createStatus<T extends IStatus, Args extends unknown[]>(
    status: new (...args: Args) => T,
    args?: Args,
    target?: Target
  ): void;
  createCombatStatus<T extends IStatus, Args extends unknown[]>(
    status: new (...args: Args) => T,
    args?: Args,
    target?: Target
  ): void;

  createSupport(support: unknown): void;
  summon(summon: unknown): void;

  generateDice(...dice: DiceType[]): void;
  drawCards(count: number): void;
  createCards(...cards: (new () => ICard)[]): void;

  switchActive(target: SwitchTarget, manualObjectId?: number): void;
  useSkill(skillName: string): void;
  flipNextTurn(): void;

  isMyCharacter(target: Target): boolean;
}

export interface SkillDescriptionContext extends Context {
  readonly triggeredByCard: number | undefined;
}

export interface SkillContext extends Context {
  readonly info: SkillInfo;
  readonly character: ICharacter;
  readonly damageType: DamageType;

  addDamage(value: number): void;
  multiplyDamage(multiplier: number): void;
  changeDamageType(type: DamageType): void;
}

export interface UseDiceContext extends Context {
  readonly skill?: SkillContext;
  readonly switch?: boolean;
  readonly card?: unknown;
  deductCost(type: DiceType, number?: number): void;
}

export interface DamageContext extends Context {
  readonly target: Target;
}
