import { Context, DamageContext, SkillContext, UseDiceContext } from "../contexts";

export type HandlerResult = boolean | void;

export interface IGlobalEvents {
  onActionPhase?:(c: Context) => HandlerResult;
  onTurn?: (c: Context) => HandlerResult;
  onEndPhase?: (c: Context) => HandlerResult;

  onBeforeUseSkill?: (c: SkillContext) => HandlerResult;
  onUseSkill?: (c: SkillContext) => HandlerResult;

  onBeforeUseDice?: (c: UseDiceContext) => HandlerResult;

  onElementalReaction?: () => HandlerResult;
  onDamage?: (c: DamageContext) => HandlerResult;
  onDefeated?: (c: DamageContext) => HandlerResult;
}

export * from "./character";
export * from "./skill";
export * from "./status";
export * from "./card";
