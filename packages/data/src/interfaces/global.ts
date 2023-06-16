import { Context, DamageContext, SkillContext, UseDiceContext } from "../contexts";

export type HandlerResult = boolean | void;

export interface IGlobalEvents {
  onActionPhase?:(c: Context) => HandlerResult;
  onTurn?: (c: Context) => HandlerResult;
  onEndPhase?: (c: Context) => HandlerResult;

  onUseSkill?: (c: SkillContext) => HandlerResult;
  onBeforeDealDamage?: (c: DamageContext) => HandlerResult;
  onDealDamage?: (c: DamageContext) => HandlerResult;
  
  onBeforeUseDice?: (c: UseDiceContext) => HandlerResult;
  onBeforeSwitchShouldFast?: () => boolean;

  // onElementalReaction?: () => HandlerResult;
  onDamaged?: (c: DamageContext) => HandlerResult;
  onDefeated?: (c: DamageContext) => HandlerResult;
}

export * from "./character";
export * from "./skill";
export * from "./status";
export * from "./card";
