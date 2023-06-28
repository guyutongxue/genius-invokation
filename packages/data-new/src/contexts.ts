import { DamageType, DiceType } from "@gi-tcg/typings";
import { CardHandle, CharacterHandle, SkillHandle, StatusHandle, SummonHandle, SupportHandle } from "./builders";
import { Target } from "./target";
import { SkillInfoWithId } from "./skills";
import { CharacterContext, CharacterInfoWithId } from "./characters";
import { CardInfoWithId, CardTarget, CardTargetDescriptor, ContextOfTarget } from "./cards";
import { SummonContext } from ".";
import { StatusContext } from "./statuses";

export enum SpecialBits {
  DefeatedMine = 0,
  DefeatedOpp = 1,
  Plunging = 2
}

export interface Context {
  readonly currentPhase: "action" | "end";
  readonly currentTurn: number;
  isMyTurn(): boolean;
  checkSpecialBit(bit: SpecialBits): boolean;

  hasCharacter(ch: CharacterHandle): CharacterContext | null;
  allMyCharacters(onlyAlive?: boolean): CharacterContext[];
  hasSummon(summon: SummonHandle): SummonContext | null;
  allSummons(): SummonContext[];
  hasCombatStatus(status: StatusHandle): StatusContext | null;
  hasCombatShield(): StatusContext | null;

  dealDamage(value: number, type: DamageType, target?: Target): void;
  applyElement(type: DamageType, target?: Target): void;
  heal(value: number, target?: Target): void;
  gainEnergy(value?: number, target?: Target): number;
  lossEnergy(value?: number, target?: Target): number;

  createStatus(status: StatusHandle, target?: Target): StatusContext;
  removeStatus(status: StatusHandle, target?: Target): boolean;
  createCombatStatus(status: StatusHandle, opp?: boolean): StatusContext;

  summon(summon: SummonHandle): void;
  summonOneOf(...summons: SummonHandle[]): void;
  createSupport(support: SupportHandle, opp?: boolean): void;

  rollDice(count: number): void;
  generateDice(...dice: DiceType[]): void;
  removeAllDice(): DiceType[];

  getCardCount(opp?: boolean): number;
  drawCards(count: number, opp?: boolean): void;
  createCards(...cards: CardHandle[]): void;
  switchCards(): Promise<void>;

  switchActive(target: Target): void;
  useSkill(skill: SkillHandle | "normal"): void;
  flipNextTurn(): void;

  getMaster(): CharacterContext;
  dispose(): void;
}

export interface RollContext {
  readonly activeCharacterElement: DiceType;
  fixDice(...dice: DiceType[]): void;
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

export interface UseDiceContext {
  readonly useSkill?: SkillInfoWithId;
  readonly switchActive?: boolean;
  readonly playCard?: {
    info: CardInfoWithId;
    isTalentOf(entityId: number): boolean;
  }
  addCost(...dice: DiceType[]): void;
  deductCost(...dice: DiceType[]): void;

  getMaster(): CharacterContext;
  dispose(): void;
}

export interface DamageContext extends Context {
  readonly target: CharacterContext;
  readonly damageType: DamageType;
  readonly reaction?: ElementalReactionContext;

  addDamage(value: number): void;
  multiplyDamage(multiplier: number): void;
  changeDamageType(type: DamageType): void;
  decreaseDamage(value: number): void;
}

// export interface PlayCardContext extends Context {
// }

export interface SwitchActiveContext extends Context {
  readonly from: CharacterContext;
  readonly to: CharacterContext;
}

export interface ElementalReactionContext extends Context {
  readonly reactionType: unknown;
  relatedWith(d: DamageType): boolean;
  readonly damage: DamageContext | null;
}
