import { DiceType, DamageType } from "@jenshin-tcg/typings";
import { ICharacter } from "./interfaces/character";
import { SkillInfo } from "./interfaces/skill";
import { IStatus } from "./interfaces/status";
import { CardInfo, CardWith, ICard, ISummon } from ".";


export interface Context {
  readonly currentPhase: "action" | "end";
  readonly currentTurn: number;
  isMyTurn(): boolean;

  dealDamage(value: number, type: DamageType, target?: number): void;
  applyElement(type: DamageType, target?: number): void;
  heal(value: number, target?: number): void;
  gainEnergy(value?: number, target?: number): number;
  lossEnergy(value?: number, target?: number): number;

  createStatus<T extends IStatus, Args extends unknown[]>(
    status: new (...args: Args) => T,
    args?: Args,
    target?: number
  ): void;
  removeStatus<T extends IStatus>(status: new (...args: unknown[]) => T, target?: number): boolean;
  createCombatStatus<T extends IStatus, Args extends unknown[]>(
    status: new (...args: Args) => T,
    args?: Args,
    target?: number
  ): void;

  // createSupport(support: unknown): void;
  summon<T extends ISummon>(summon: new (...args: unknown[]) => T): void;

  generateDice(...dice: DiceType[]): void;
  drawCards(count: number): void;
  createCards(...cards: (new () => ICard)[]): void;
  switchCards(): Promise<void>;

  switchActive(target: number): void;
  useSkill(skillName: string): void;
  flipNextTurn(): void;
  passTurn(): void;
  
  dispose(): void;
}

export interface SkillDescriptionContext extends Context {
  readonly triggeredByCard: number | undefined;
  readonly character: ICharacter;
}

export interface SkillContext extends Context {
  readonly info: SkillInfo;
  readonly character: ICharacter;
  readonly damage?: DamageContext;
  isCharged(): boolean;
  isPlunging(): boolean;
  disableSkill(): void;
}

export interface UseDiceContext /* extends Context  */{
  readonly skill?: SkillInfo;
  readonly switch?: boolean;
  readonly card?: CardInfo;
  deductCost(...dice: DiceType[]): void;
}

export interface DamageContext extends Context {
  readonly target: ICharacter;
  readonly damageType: DamageType;

  addDamage(value: number): void;
  multiplyDamage(multiplier: number): void;
  changeDamageType(type: DamageType): void;
  decreaseDamage(value: number): void;
}

export interface UseCardContext extends Context {
}

export interface SwitchActiveContext extends Context {
  readonly from: ICharacter;
  readonly to: ICharacter;
}
