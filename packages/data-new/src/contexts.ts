import { DamageType, DiceType } from "@gi-tcg/typings";
import { CardHandle, SkillHandle, StatusHandle, SummonHandle, SupportHandle } from "./builders";
import { Target } from "./target";
import { SkillInfoWithId } from "./skills";
import { CharacterContext } from "./characters";
import { CardInfoWithId } from "./cards";

export enum SpecialBits {
  DefeatedMine = 0,
  DefeatedOpp = 1,
  Plunging = 2
}

export interface Context {
  readonly currentPhase: "action" | "end";
  readonly currentTurn: number;
  isMyTurn(): boolean;
  hasCharacter(target: Target): CharacterContext | null;
  checkSpecialBit(bit: SpecialBits): boolean;

  dealDamage(value: number, type: DamageType, target?: Target): void;
  applyElement(type: DamageType, target?: Target): void;
  heal(value: number, target?: Target): void;
  gainEnergy(value?: number, target?: Target): number;
  lossEnergy(value?: number, target?: Target): number;

  createStatus(status: StatusHandle, target?: Target): void;
  removeStatus(status: StatusHandle, target?: Target): boolean;
  createCombatStatus(status: StatusHandle, opp?: boolean): void;

  summon(summon: SummonHandle): void;
  // createSupport(support: SupportHandle): void;

  generateDice(...dice: DiceType[]): void;
  drawCards(count: number): void;
  createCards(...cards: CardHandle[]): void;
  switchCards(): Promise<void>;

  switchActive(target: Target): void;
  useSkill(skill: SkillHandle): void;
  flipNextTurn(): void;
  passTurn(): void;

  dispose(): void;
}

export interface SkillDescriptionContext extends Context {
  triggeredByCard(card: unknown): boolean;
  readonly character: CharacterContext;
}

export interface SkillReadonlyContext extends Context {
  readonly info: SkillInfoWithId;
  readonly character: CharacterContext;
  isCharged(): boolean;
  isPlunging(): boolean;
}

export interface SkillContext extends SkillReadonlyContext {
  readonly damage?: DamageContext;
}

export interface UseDiceContext /* extends Context  */ {
  readonly skill?: SkillInfoWithId;
  readonly switch?: boolean;
  readonly card?: CardInfoWithId;
  addCost(...dice: DiceType[]): void;
  deductCost(...dice: DiceType[]): void;
}

export interface DamageContext extends Context {
  readonly target: CharacterContext;
  readonly damageType: DamageType;

  addDamage(value: number): void;
  multiplyDamage(multiplier: number): void;
  changeDamageType(type: DamageType): void;
  decreaseDamage(value: number): void;
}

export interface PlayCardContext extends Context {}

export interface SwitchActiveContext extends Context {
  readonly from: CharacterContext;
  readonly to: CharacterContext;
}

export interface ElementalReactionContext extends Context {
  readonly reactionType: unknown;
  relatedWith(d: DamageType): boolean;
  readonly damage: DamageContext | null;
}
