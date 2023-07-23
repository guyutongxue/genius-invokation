import type { DamageType, DiceType } from "@gi-tcg/typings";
import { CardHandle, CharacterHandle, SkillHandle, StatusHandle, SummonHandle, SupportHandle } from "./builders";
import { ValidSelector } from "./target";
import { SkillContext } from "./skills";
import { CharacterContext, CharacterInfoWithId } from "./characters";
import { CardInfoWithId, CardTag, CardTarget, PlayCardContext } from "./cards";
import { SummonContext } from ".";
import { StatusContext } from "./statuses";

export interface RollContext {
  fixDice(...dice: DiceType[]): void;
  addRerollCount(count: number): void;
}

export interface UseDiceContext {
  readonly useSkillCtx?: SkillContext;
  readonly switchActiveCtx?: SwitchActiveContext;
  readonly playCardCtx?: PlayCardContext;
  addCost(...dice: DiceType[]): void;
  deductCost(...dice: DiceType[]): void;
}

interface DamageBaseContext  {
  readonly sourceSummon?: SummonContext<false>;
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
  addDamage(value: number): void;
  multiplyDamage(multiplier: number): void;
  decreaseDamage(value: number): void;
}

export interface SkillDamageContext extends DamageContext {
  readonly sourceSkill: SkillContext;
}

export interface BeforeDefeatedContext  {
  immune(healTo: number): void;
}

export interface SwitchActiveContext {
  readonly from: CharacterContext;
  readonly to: CharacterContext;
}

export interface ElementalReactionContext {
  readonly reactionType: unknown;
  relatedWith(d: DamageType): boolean;
  swirledElement(): DamageType.Cryo | DamageType.Hydro | DamageType.Pyro | DamageType.Electro | null;
}

export interface RequestFastSwitchContext {
  requestFast(condition?: boolean): void;
}
