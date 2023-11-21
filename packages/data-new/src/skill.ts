import { DamageType, DiceType, Reaction } from "@gi-tcg/typings";
import { CardState, CharacterState, EntityState, GameState } from "./state";
import { CardTarget } from "./card";

interface SkillDefinitionBase<Ctx> {
  readonly type: "skill";
  readonly id: number;
  readonly action: SkillDescription<Ctx>;
}

type SkillDescription<Ctx> = (
  state: GameState,
  emitted: InSkillEventPayload[],
  ctx?: Ctx,
) => GameState | PromiseLike<GameState>;

interface SyncSkillDefinitionBase<Ctx = any> {
  readonly type: "skill";
  readonly id: number;
  readonly action: SyncSkillDescription<Ctx>;
}

type SyncSkillDescription<Ctx> = (
  state: GameState,
  emitted: readonly [],
  ctx?: Ctx,
) => GameState;

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
  readonly via: SkillDefinition;
  readonly target: CharacterState;
}

export interface ReactionInfo {
  readonly type: Reaction;
  readonly via: SkillDefinition;
  readonly target: CharacterState;
  readonly damage?: DamageInfo;
}

export interface UseSkillInfo {
  readonly type: "useSkill";
  readonly who: 0 | 1;
  readonly source: CharacterState;
  readonly via?: SkillDefinition;
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
  readonly via?: SkillDefinition;
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
  onElementalReaction: ReactionInfo;

  onEnter: 0;
  onDispose: 0;
  onRevive: 0;
};

export type InSkillEvent = "onSwitchActive" | "onDamage" | "onElementalReaction";
export type InSkillEventPayload = {
  [E in InSkillEvent]: [E, AsyncEventMap[E]];
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
