import { DamageType, DiceType, Reaction } from "@gi-tcg/typings";
import { CardState, CharacterState, EntityState, GameState } from "./state";
import { CardTarget } from "./card";

export interface SkillDefinitionBase<Arg> {
  readonly type: "skill";
  readonly id: number;
  readonly action: SkillDescription<Arg>;
}

type SkillResult = readonly [GameState, DeferredActions[]];

export type SkillDescription<Arg> = (
  state: GameState,
  callerId: number,
  ctx: Arg,
) => SkillResult;

export type CommonSkillType = "normal" | "elemental" | "burst";
export type SkillType = CommonSkillType | "card";

export interface InitiativeSkillDefinition<Arg = void>
  extends SkillDefinitionBase<Arg> {
  readonly skillType: SkillType;
  readonly costs: readonly DiceType[];
  readonly triggerOn: null;
}

export interface RollModifier {
  readonly who: 0 | 1;
  fixDice(...dice: DiceType[]): void;
  addRerollCount(count: number): void;
}

export interface UseDiceModifier {
  readonly who: 0 | 1;
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

export interface DefeatedModifier {
  readonly info: DamageInfo;
  immune(): void;
}

type SyncEventMap = {
  onRoll: RollModifier;
  onBeforeUseDice: UseDiceModifier;
  onBeforeDamage0: DamageModifier;
  onBeforeDamage1: DamageModifier;
  onBeforeDefeated: DefeatedModifier;
};

export interface SkillInfo {
  readonly caller: CharacterState | EntityState;
  /**
   * 仅当此技能是作为卡牌描述的一部分时才有值。
   */
  readonly fromCard: CardState | null;
  readonly definition: SkillDefinition;
  /**
   * 若此技能通过 `requestSkill` 如准备技能、天赋牌等触发，
   * 则此字段指定编写了上述 `useSkill` 的技能的 `SkillInfo`
   */
  readonly requestBy: SkillInfo | null;
}

export interface DamageInfo {
  readonly type: DamageType;
  readonly value: number;
  readonly source: CharacterState | EntityState;
  readonly via: SkillInfo;
  readonly target: CharacterState;
}

export interface HealInfo {
  readonly expectedValue: number;
  readonly finalValue: number;
  readonly source: CharacterState | EntityState;
  readonly via: SkillInfo;
  readonly target: CharacterState;
}

export interface ReactionInfo {
  readonly type: Reaction;
  readonly via: SkillInfo;
  readonly target: CharacterState;
  readonly damage?: DamageInfo;
}

export interface UseSkillInfo {
  readonly type: "useSkill";
  readonly who: 0 | 1;
  readonly skill: SkillInfo;
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
  readonly via?: SkillInfo;
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

export type ActionInfo = (
  | UseSkillInfo
  | PlayCardInfo
  | SwitchActiveInfo
  | ElementalTuningInfo
  | DeclareEndInfo
) & {
  cost: DiceType[];
};

type NULL = Record<never, never>;

type AsyncEventMap = {
  onBattleBegin: NULL;
  onActionPhase: NULL;
  onEndPhase: NULL;

  onBeforeAction: { who: 0 | 1 };
  onAction: ActionInfo;

  onSkill: SkillInfo;
  onSwitchActive: SwitchActiveInfo;
  onDamage: DamageInfo;
  onHeal: HealInfo;
  onElementalReaction: ReactionInfo;

  onEnter: { entity: CharacterState | EntityState };
  onDisposing: { entity: EntityState };
  onDefeated: { character: CharacterState };
  onRevive: { character: CharacterState };
};

export type EventMap = SyncEventMap & AsyncEventMap;
export type EventNames = keyof EventMap;

// state 为引发事件后的现场状态
export type EventArg<E extends EventNames> = EventMap[E] & { state: GameState };

type InSkillEvent =
  | "onSwitchActive"
  | "onDamage"
  | "onHeal"
  | "onElementalReaction"
  | "onEnter"
  | "onDisposing"
  | "onDefeated"
  | "onRevive";
type InSkillEventPayload = {
  [E in InSkillEvent]: readonly [
    eventName: E,
    eventArg: Omit<EventArg<E>, "via">,
  ];
}[InSkillEvent];

export type AsyncRequest =
  | readonly [type: "requestSwitchCards"]
  | readonly [type: "requestReroll", times: number]
  | readonly [type: "requestUseSkill", skillId: number];

export type DeferredActions = InSkillEventPayload | AsyncRequest;

export type TriggeredSkillDefinition = {
  [E in EventNames]: SkillDefinitionBase<EventArg<E>> & {
    triggerOn: E;
  };
}[EventNames];

export type SkillDefinition =
  | InitiativeSkillDefinition
  | InitiativeSkillDefinition<CardTarget>
  | TriggeredSkillDefinition;
