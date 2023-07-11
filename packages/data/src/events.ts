import { BeforeDamageCalculatedContext, BeforeDefeatedContext, Context, DamageContext, DamageReadonlyContext, ElementalReactionContext, PlayCardContext, RollContext,  SkillDamageContext, SkillContext, SwitchActiveContext, UseDiceContext } from "./contexts";

export type HandlerResult = boolean | void | Promise<boolean | void>;

export interface EventHandlers<This = {}> {
  onBattleBegin?(this: This, c: Context): HandlerResult;
  onRollPhase?(this: This, c: RollContext): HandlerResult;
  onActionPhase?(this: This, c: Context): HandlerResult;
  onTurn?(this: This, c: Context): HandlerResult;
  onEndPhase?(this: This, c: Context): HandlerResult;

  onBeforeAction?(this: This, c: Context): HandlerResult;
  onUseSkill?(this: This, c: SkillContext): HandlerResult;

  onRequestFastSwitchActive?(this: This, c: Context): boolean;
  onPlayCard?(this: This, c: PlayCardContext): HandlerResult;
  onSwitchActive?(this: This, c: SwitchActiveContext): HandlerResult;
  onDeclareEnd?(this: This, c: Context): HandlerResult;

  // 对于角色技能、角色状态、装备来说，默认仅监听角色技能造成的伤害，不包括元素反应
  // 对于出战状态、支援牌、召唤物来说，默认仅监听我方造成的伤害，包括元素反应
  onEarlyBeforeDealDamage?(this: This, c: BeforeDamageCalculatedContext): HandlerResult;
  onBeforeSkillDamage?(this: This, c: SkillDamageContext): HandlerResult;
  onBeforeDealDamage?(this: This, c: DamageContext): HandlerResult;
  onBeforeDamaged?(this: This, c: DamageContext): HandlerResult;

  onDealDamage?(this: This, c: DamageReadonlyContext): HandlerResult;
  onDamaged?(this: This, c: DamageReadonlyContext): HandlerResult;

  onBeforeDefeated?(this: This, c: BeforeDefeatedContext): HandlerResult;
  onDefeated?(this: This, c: DamageReadonlyContext): HandlerResult;

  onBeforeUseDice?(this: This, c: UseDiceContext): HandlerResult;
  onBeforeSwitchShouldFast?(this: This): HandlerResult;

  onElementalReaction?(this: This, c: ElementalReactionContext): HandlerResult;

}

export type EventHandlerCtor = new () => EventHandlers;

export type ListenTarget = "master" | "my" | "all";

export type EventHandlerNames = keyof EventHandlers;
export type ContextOfEvent<E extends EventHandlerNames> = Parameters<Required<EventHandlers>[E]>[0];
