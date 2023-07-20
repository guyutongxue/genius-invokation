import { BeforeDamageCalculatedContext, BeforeDefeatedContext, Context, DamageContext, DamageReadonlyContext, ElementalReactionContext, PlayCardContext, RollContext,  SkillDamageContext, SkillContext, SwitchActiveContext, UseDiceContext, RequestFastSwitchContext } from "./contexts";

export type HandlerResult = boolean | void | Promise<boolean | void>;

export interface EventHandlers<This = {}> {
  onBattleBegin?(this: This, c: Context): HandlerResult;
  onRollPhase?(this: This, c: RollContext): HandlerResult;
  onActionPhase?(this: This, c: Context): HandlerResult;
  onEndPhase?(this: This, c: Context): HandlerResult;

  onBeforeAction?(this: This, c: Context): HandlerResult;
  onRequestFastSwitchActive?(this: This, c: RequestFastSwitchContext): HandlerResult;

  onUseSkill?(this: This, c: SkillContext): HandlerResult;
  onAction?(this: This, c: Context): HandlerResult;
  onPlayCard?(this: This, c: PlayCardContext): HandlerResult;
  onSwitchActive?(this: This, c: SwitchActiveContext): HandlerResult;
  onDeclareEnd?(this: This, c: Context): HandlerResult;

  // listenTo "master": 监听角色技能造成的伤害，不包括元素反应
  // listenTo "my": 监听我方造成的伤害，包括元素反应
  // .... 如果要筛选出“我方角色导致的元素反应”，请检测 sourceSkill
  onEarlyBeforeDealDamage?(this: This, c: BeforeDamageCalculatedContext): HandlerResult;
  onBeforeSkillDamage?(this: This, c: SkillDamageContext): HandlerResult;
  onBeforeDealDamage?(this: This, c: DamageContext): HandlerResult;
  onBeforeDamaged?(this: This, c: DamageContext): HandlerResult;

  onDealDamage?(this: This, c: DamageReadonlyContext): HandlerResult;
  onDamaged?(this: This, c: DamageReadonlyContext): HandlerResult;

  onBeforeDefeated?(this: This, c: BeforeDefeatedContext): HandlerResult;
  onDefeated?(this: This, c: DamageReadonlyContext): HandlerResult;
  onRevive?(this: This, c: Context): HandlerResult;

  onBeforeUseDice?(this: This, c: UseDiceContext): HandlerResult;

  onElementalReaction?(this: This, c: ElementalReactionContext): HandlerResult;

  onEnter?(this: This, c: Context): HandlerResult;
}

export type EventHandlerCtor = new () => EventHandlers;

export type ListenTarget = "master" | "my" | "all";

export type EventHandlerNames = keyof EventHandlers;
export type ContextOfEvent<E extends EventHandlerNames> = Parameters<Required<EventHandlers>[E]>[0];
