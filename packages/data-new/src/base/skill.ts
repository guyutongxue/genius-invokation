import { DamageType, DiceType, Reaction } from "@gi-tcg/typings";
import { CardState, CharacterState, EntityState, GameState } from "./state";
import { CardTarget } from "./card";

type SkillId = number;

interface SkillDefinitionBase<Ctx> {
  readonly type: "skill";
  readonly id: SkillId;
  readonly action: SkillDescription<Ctx>;
}

type SkillResult = readonly [GameState, DeferredActions[]];

export type SkillDescription<Ctx> = (
  state: GameState,
  callerId: number,
  ctx: Ctx,
) => SkillResult;

export type CommonSkillType = "normal" | "elemental" | "burst";
export type SkillType = CommonSkillType | "card";

export interface InitiativeSkillDefinition<Ctx = void>
  extends SkillDefinitionBase<Ctx> {
  readonly skillType: SkillType;
  readonly costs: DiceType[];
  readonly triggerOn: null;
}

export interface RollModifier {
  fixDice(...dice: DiceType[]): void;
  addRerollCount(count: number): void;
}

export interface UseDiceModifier {
  readonly action: ActionInfo;
  readonly currentCost: DiceType[];
  addCost(...dice: DiceType[]): void;
  deductCost(...dice: DiceType[]): DiceType[];
  requestFastSwitch(): boolean;
}

export interface DamageModifier {
  readonly info: DamageInfo;
  changeDamageType(type: DamageType): void;
  increaseDamage(value: number): void;
  multiplyDamage(multiplier: number): void;
  decreaseDamage(value: number): void;
}

type SyncEventMap = {
  onRoll: RollModifier;
  onBeforeUseDice: UseDiceModifier;
  onEarlyBeforeDealDamage: DamageModifier;
  onBeforeDealDamage: DamageModifier;
  onBeforeDamaged: DamageModifier;
  onBeforeDefeated: DamageModifier;
};

export interface DamageInfo {
  readonly type: DamageType;
  readonly value: number;
  readonly source: CharacterState | EntityState;
  readonly via: SkillId;
  readonly target: CharacterState;
}

export interface HealInfo {
  readonly expectedValue: number;
  readonly finalValue: number;
  readonly source: CharacterState | EntityState;
  readonly via: SkillId;
  readonly target: CharacterState;
}

export interface ReactionInfo {
  readonly type: Reaction;
  readonly via: SkillId;
  readonly target: CharacterState;
  readonly damage?: DamageInfo;
}

export interface UseSkillInfo {
  readonly type: "useSkill";
  readonly who: 0 | 1;
  readonly source: CharacterState;
  readonly via?: SkillId;
  readonly skill: SkillDefinition;
}

export interface PlayCardInfo {
  readonly type: "playCard";
  readonly who: 0 | 1;
  readonly card: CardState;
  readonly target: CardTarget;
}

export interface SwitchActiveInfo {
  readonly type: "switchActive";
  readonly who: 0 | 1;
  readonly from: CharacterState;
  readonly via?: SkillId;
  readonly to: CharacterState;
}

export interface ElementalTuningInfo {
  readonly type: "elementalTuning";
  readonly who: 0 | 1;
  readonly card: CardState;
  readonly result: DiceType;
}

export interface DeclareEndInfo {
  readonly type: "declareEnd";
  readonly who: 0 | 1;
}

export type ActionInfo =
  | UseSkillInfo
  | PlayCardInfo
  | SwitchActiveInfo
  | ElementalTuningInfo
  | DeclareEndInfo;

type AsyncEventMap = {
  onBattleBegin: 0;
  onActionPhase: 0;
  onEndPhase: 0;

  onBeforeAction: 0;
  onAction: ActionInfo;

  onSwitchActive: SwitchActiveInfo;
  onDamage: DamageInfo;
  onHeal: HealInfo;
  onElementalReaction: ReactionInfo;

  onEnter: { entity: CharacterState | EntityState };
  onDispose: { entity: EntityState };
  onDefeated: { character: CharacterState };
  onRevive: { character: CharacterState };
};

// state 为引发事件后的现场状态
type SyncEventArg<E extends keyof SyncEventMap> = SyncEventMap[E] & { state: GameState };
type AsyncEventArg<E extends keyof AsyncEventMap> = AsyncEventMap[E] & { state: GameState };

type InSkillEvent =
  | "onSwitchActive"
  | "onDamage"
  | "onHeal"
  | "onElementalReaction"
  | "onEnter"
  | "onDispose"
  | "onDefeated"
  | "onRevive";
type InSkillEventPayload = {
  [E in InSkillEvent]: readonly [eventName: E, eventArg: AsyncEventArg<E>];
}[InSkillEvent];

export type AsyncRequest =
  | readonly [type: "requestSwitchCards"]
  | readonly [type: "requestReroll", times: number]
  | readonly [type: "requestUseSkill", skillId: number]

export type DeferredActions = InSkillEventPayload | AsyncRequest;

export type TriggeredSkillDefinition = ({
  [E in keyof SyncEventMap]: SkillDefinitionBase<SyncEventArg<E>> & {
    triggerOn: E;
  };
} & {
  [E in keyof AsyncEventMap]: SkillDefinitionBase<AsyncEventArg<E>> & {
    triggerOn: E;
  };
})[keyof SyncEventMap | keyof AsyncEventMap];

export type SkillDefinition =
  | InitiativeSkillDefinition
  | InitiativeSkillDefinition<CardTarget>
  | TriggeredSkillDefinition;
