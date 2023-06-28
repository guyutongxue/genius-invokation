import { BeforeDamageCalculatedContext, Context, DamageContext, DamageReadonlyContext, ElementalReactionContext, PlayCardContext, RollContext, SkillContext, SkillReadonlyContext, SwitchActiveContext, UseDiceContext } from "./contexts";

export type HandlerResult = boolean | void;

export interface EventHandlers<This = {}> {
  onRollPhase?(this: This, c: RollContext): HandlerResult;
  onActionPhase?(this: This, c: Context): HandlerResult;
  onTurn?(this: This, c: Context): HandlerResult;
  onEndPhase?(this: This, c: Context): HandlerResult;

  onBeforeAction?(this: This, c: Context): HandlerResult;

  onBeforeUseSkill?(this: This, c: SkillContext): HandlerResult;
  onUseSkill?(this: This, c: SkillReadonlyContext): HandlerResult;

  onRequestFastSwitchActive?(this: This): boolean;
  onPlayCard?(this: This, c: PlayCardContext): HandlerResult;
  onSwitchActive?(this: This, c: SwitchActiveContext): HandlerResult;
  onDeclareEnd?(this: This, c: Context): HandlerResult;

  onBeforeDamageCalculated?(this: This, c: BeforeDamageCalculatedContext): HandlerResult;
  onBeforeDealDamage?(this: This, c: DamageContext): HandlerResult;
  onDealDamage?(this: This, c: DamageContext): HandlerResult;
  onBeforeDamaged?(this: This, c: DamageContext): HandlerResult;
  onDamaged?(this: This, c: DamageReadonlyContext): HandlerResult;
  onDefeated?(this: This, c: DamageReadonlyContext): HandlerResult;

  onBeforeUseDice?(this: This, c: UseDiceContext): HandlerResult;
  onBeforeSwitchShouldFast?(this: This): HandlerResult;

  onElementalReaction?(this: This, c: ElementalReactionContext): HandlerResult;

}

export type EventHandlerCtor = new () => EventHandlers;

export type ListenTarget = "master" | "my" | "all";
