import { DiceType, DamageType } from "@jenshin-tcg/typings";
import { ICharacter } from "./interfaces/character";
import { SkillInfo } from "./interfaces/skill";
import { IStatus } from "./interfaces/status";
import { CardWith, ICard } from ".";


export interface Context {
  readonly currentPhase: "action" | "end";
  readonly currentTurn: number;
  isMyTurn(): boolean;

  damage(value: number, type: DamageType, target?: number): void;
  heal(value: number, target?: number): void;
  gainEnergy(value?: number, target?: number): void;

  createStatus<T extends IStatus, Args extends unknown[]>(
    status: new (...args: Args) => T,
    args?: Args,
    target?: number
  ): void;
  createCombatStatus<T extends IStatus, Args extends unknown[]>(
    status: new (...args: Args) => T,
    args?: Args,
    target?: number
  ): void;

  createSupport(support: unknown): void;
  summon(summon: unknown): void;

  generateDice(...dice: DiceType[]): void;
  drawCards(count: number): void;
  createCards(...cards: (new () => ICard)[]): void;

  switchActive(target: number): void;
  useSkill(skillName: string): void;
  flipNextTurn(): void;
  
  dispose(): void;
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
  readonly target: number;
  decreaseDamage(value: number): void;
}

export interface UseCardContext extends Context {
}
