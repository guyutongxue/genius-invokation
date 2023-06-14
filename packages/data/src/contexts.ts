import { DiceType, DamageType } from "@jenshin-tcg/typings";
import { ICharacter } from "./interfaces/character";
import { SkillInfo } from "./interfaces/skill";
import { IStatusConstructor } from "./interfaces/status";

export enum Target {
  ACTIVE,
  STANDBY,
  OPP_ACTIVE,
  OPP_STANDBY,
  MASTER,
  MASTER_ACTIVE,
  MASTER_STANDBY,
}

export interface Context {
  damage(value: number, type: DamageType, target?: Target): void;
  heal(value: number, target?: Target): void;

  createStatus(status: IStatusConstructor): void;
  createCombatStatus(status: IStatusConstructor, opposite?: boolean): void;

  summon(summon: unknown): void;
}


export interface SkillContext extends Context {
  readonly info: SkillInfo;
  readonly character: ICharacter;
  addDamage(value: number): void;
  multiplyDamage(multiplier: number): void;
}

export interface UseDiceContext extends Context {
  readonly skill?: SkillContext;
  readonly switch?: boolean;
  readonly card?: unknown;
  deductCost(type: DiceType, number?: number): void;
}
