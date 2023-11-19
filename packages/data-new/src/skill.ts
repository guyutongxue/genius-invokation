import { GameState } from "./state";

type SyncEventMap = {
  onRoll: RollModifier;
  onBeforeUseDice: UseDiceModifier;
  onEarlyBeforeDealDamage: DamageModifier;
  onBeforeDealDamage: DamageModifier;
  onBeforeDamaged: DamageModifier;
  onBeforeDefeated: DamageModifier;
};

type AsyncEventMap = {
  onBattleBegin: 0;
  onActionPhase: 0;
  onEndPhase: 0;

  onBeforeAction: 0;
  onAction: ActionInfo;

  onSkill: SkillInfo; // on elemental reaction
  onSwitchActive: SwitchActiveInfo;
  onDamage: DamageInfo;

  onEnter: 0;
  onDispose: 0;
  onRevive: 0;
};

export type EventHandlers = Partial<
  {
    [E in keyof SyncEventMap]: (e: SyncEventMap[E]) => SyncSkillDescription;
  } & {
    [E in keyof AsyncEventMap]: (e: AsyncEventMap[E]) => SkillDescription;
  }
>;

type SyncSkillDescription = (state: GameState) => GameState;

export type SkillDescription = (
  state: GameState,
) => GameState | PromiseLike<GameState>;

export type SkillFilter = (state: GameState) => boolean;
