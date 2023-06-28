import { Context, DamageContext, ElementalReactionContext, SkillContext, SkillReadonlyContext, SwitchActiveContext, UseDiceContext } from "./contexts";

export type HandlerResult = boolean | void;

export interface EventHandlers<This = {}> {
  onActionPhase?(this: This, c: Context): HandlerResult;
  onTurn?(this: This, c: Context): HandlerResult;
  onEndPhase?(this: This, c: Context): HandlerResult;

  onBeforeAction?(this: This, c: Context): HandlerResult;
  onBeforeUseSkill?(this: This, c: SkillContext): HandlerResult;
  onUseSkill?(this: This, c: SkillReadonlyContext): HandlerResult;
  onSwitchActive?(this: This, c: SwitchActiveContext): HandlerResult;
  // onSwitchActiveFrom?(this: This, c: SwitchActiveContext): HandlerResult;
  onDeclareEnd?(this: This, c: Context): HandlerResult;
  onBeforeDealDamage?(this: This, c: DamageContext): HandlerResult;
  onDealDamage?(this: This, c: DamageContext): HandlerResult;

  onBeforeUseDice?(this: This, c: UseDiceContext): HandlerResult;
  onBeforeSwitchShouldFast?(this: This): HandlerResult;

  onElementalReaction?(this: This, c: ElementalReactionContext): HandlerResult;
  onDamaged?(this: This, c: DamageContext): HandlerResult;
  onDefeated?(this: This, c: DamageContext): HandlerResult;
}

export type EventHandlerCtor = new () => EventHandlers;
