import { DamageType, DiceType, Reaction } from "@gi-tcg/typings";
import { CardState, CharacterState, EntityState, GameState } from "./state";
import { CardTarget } from "./card";

type SkillId = number;

interface SkillDefinitionBase<Ctx> {
  readonly type: "skill";
  readonly id: SkillId;
  readonly action: SkillDescription<Ctx>;
}

type SkillResult = readonly [GameState, InSkillEventPayload[]];

type SkillDescription<Ctx> = (
  state: GameState,
  callerId: number,
  ctx?: Ctx,
) => SkillResult | PromiseLike<SkillResult>;

interface SyncSkillDefinitionBase<Ctx = any> {
  readonly type: "skill";
  readonly id: SkillId;
  readonly action: SyncSkillDescription<Ctx>;
}

type SyncSkillDescription<Ctx> = (
  state: GameState,
  callerId: number,
  ctx?: Ctx,
) => SkillResult;

export interface InitiativeSkillDefinition<Ctx = never>
  extends SkillDefinitionBase<Ctx> {
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

  onEnter: CharacterState | EntityState;
  onDispose: EntityState;
  onDefeated: CharacterState;
  onRevive: CharacterState;
};

export type InSkillEvent =
  | "onSwitchActive"
  | "onDamage"
  | "onHeal"
  | "onElementalReaction"
  | "onEnter"
  | "onDispose"
  | "onDefeated"
  | "onRevive";
export type InSkillEventPayload = {
  [E in InSkillEvent]: [eventName: E, eventArg: AsyncEventMap[E]];
}[InSkillEvent];

export type TriggeredSkillDefinition = ({
  [E in keyof SyncEventMap]: SyncSkillDefinitionBase<SyncEventMap[E]> & {
    triggerOn: E;
  };
} & {
  [E in keyof AsyncEventMap]: SkillDefinitionBase<AsyncEventMap[E]> & {
    triggerOn: E;
  };
})[keyof SyncEventMap | keyof AsyncEventMap];

export type SkillDefinition =
  | InitiativeSkillDefinition
  | TriggeredSkillDefinition;

export type SkillFilter<Ctx> = (state: GameState, ctx?: Ctx) => boolean;
