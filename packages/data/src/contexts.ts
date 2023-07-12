import type { DamageType, DiceType } from "@gi-tcg/typings";
import { CardHandle, CharacterHandle, SkillHandle, StatusHandle, SummonHandle, SupportHandle } from "./builders";
import { Target } from "./target";
import { SkillInfoWithId } from "./skills";
import { CharacterContext, CharacterInfoWithId } from "./characters";
import { CardInfoWithId, CardTag, CardTarget } from "./cards";
import { SummonContext } from ".";
import { StatusContext } from "./statuses";

export enum SpecialBits {
  Defeated = 0,
  Plunging = 1,
  LegendUsed = 2,
}

export interface Context {
  readonly currentPhase: "action" | "end" | "other";
  readonly currentTurn: number;
  isMyTurn(): boolean;
  checkSpecialBit(bit: SpecialBits): boolean;

  hasCharacter(ch: CharacterHandle | Target): CharacterContext | null;
  allCharacters(opp?: boolean, includesDefeated?: boolean): CharacterContext[];
  fullSupportArea(opp: boolean): boolean;
  hasSummon(summon: SummonHandle): SummonContext | null;
  allSummons(includeOpp?: boolean): SummonContext[];
  hasCombatStatus(status: StatusHandle): StatusContext | null;
  hasCombatShield(): StatusContext | null;

  dealDamage(value: number, type: DamageType, target?: Target): void;
  applyElement(type: DamageType, target?: Target): void;
  heal(value: number, target: Target): void;
  gainEnergy(value?: number, target?: Target): number;
  loseEnergy(value?: number, target?: Target): number;

  createStatus(status: StatusHandle, target?: Target): StatusContext;
  removeStatus(status: StatusHandle, target?: Target): boolean;
  createCombatStatus(status: StatusHandle, opp?: boolean): StatusContext;

  summon(summon: SummonHandle): void;
  summonOneOf(...summons: SummonHandle[]): void;
  createSupport(support: SupportHandle, opp?: boolean): void;

  getDice(): DiceType[];
  rollDice(count: number): Promise<void>;
  generateDice(...dice: DiceType[]): void;
  generateRandomElementDice(count?: number): void;
  removeAllDice(): DiceType[];

  getCardCount(opp?: boolean): number;
  drawCards(count: number, opp?: boolean, tag?: CardTag): void;
  createCards(...cards: CardHandle[]): void;
  switchCards(): Promise<void>;

  switchActive(target: Target): void;
  useSkill(skill: SkillHandle | "normal"): void;
  flipNextTurn(): void;

  getMaster(): CharacterContext;
  asStatus(): StatusContext;
  dispose(): void;
}

export interface RollContext {
  readonly activeCharacterElement: DiceType;
  fixDice(...dice: DiceType[]): void;
  addRerollCount(count: number): void;
}

export interface SkillDescriptionContext extends Context {
  triggeredByCard(card: CardHandle): PlayCardContext;
  triggeredByStatus(status: StatusHandle): StatusContext;
  readonly character: CharacterContext;
  readonly target: CharacterContext;
  isCharged(): boolean;  // 重击
  isPlunging(): boolean; // 下落攻击
}

export interface SkillContext extends SkillDescriptionContext {
  readonly info: SkillInfoWithId;
  // 常九爷、参量质变仪：读取此次技能连带造成的所有伤害/元素反应
  getAllDescendingDamages(): DamageContext[];
  getAllDescendingReactions(): ElementalReactionContext[];
}

export interface UseDiceContext extends Context {
  readonly useSkillCtx?: SkillContext;
  readonly switchActiveCtx?: SwitchActiveContext;
  readonly playCardCtx?: PlayCardContext;
  addCost(...dice: DiceType[]): void;
  deductCost(...dice: DiceType[]): void;
}

interface DamageBaseContext extends Context {
  readonly sourceSummon?: SummonContext;
  readonly sourceSkill?: SkillContext;
  readonly sourceReaction?: ElementalReactionContext;
  readonly target: CharacterContext;
  readonly damageType: DamageType;
}

export interface DamageReadonlyContext extends DamageBaseContext {
  readonly reaction: ElementalReactionContext | null;
  readonly value: number;
}

export interface BeforeDamageCalculatedContext extends DamageBaseContext {
  changeDamageType(type: DamageType): void;  // default order = 0
  addDamage(value: number): void;
  multiplyDamage(multiplier: number): void;
  decreaseDamage(value: number): void;
}

export interface DamageContext extends DamageReadonlyContext {
  addDamage(value: number): void;            // default order = 3
  multiplyDamage(multiplier: number): void;  // default order = 3
  decreaseDamage(value: number): void;       // default order = 10
}

export interface SkillDamageContext extends DamageContext {
  readonly skillInfo: SkillInfoWithId;
  readonly characterInfo: CharacterInfoWithId;
  isCharged(): boolean;
  isPlunging(): boolean;
}

export interface BeforeDefeatedContext extends Context {
  immune(healTo: number): void;
}

export interface PlayCardContext extends Context {
  readonly info: CardInfoWithId;
  readonly target: CardTarget[keyof CardTarget][];
  isTalentOf(charId: number): boolean;
  isWeapon(type?: unknown): boolean;
}

export interface SwitchActiveContext extends Context {
  readonly from: CharacterContext;
  readonly to: CharacterContext;
}

export interface ElementalReactionContext extends Context {
  readonly reactionType: unknown;
  relatedWith(d: DamageType): boolean;
  swirledElement(): DamageType.Cryo | DamageType.Hydro | DamageType.Pyro | DamageType.Electro | null;
}

export { Target, TargetInfo, getTargetInfo } from "./target";
