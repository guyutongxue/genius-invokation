import { DamageType, DiceType, Reaction } from "@gi-tcg/typings";
import { CardState, CharacterState, EntityState, GameState } from "./state";
import { CardTarget } from "./card";
import { flip } from "@gi-tcg/utils";
import { allEntities, getActiveCharacterIndex, shiftLeft } from "../util";

export interface SkillDefinitionBase<Arg> {
  readonly type: "skill";
  readonly id: number;
  readonly action: SkillDescription<Arg>;
}

type SkillResult = readonly [GameState, DeferredAction[]];

export type SkillDescription<Arg> = (
  state: GameState,
  skillInfo: SkillInfo,
  ctx: Arg,
) => SkillResult;

export type CommonSkillType = "normal" | "elemental" | "burst";
export type SkillType = CommonSkillType | "card";

export interface InitiativeSkillDefinition<Arg = void>
  extends SkillDefinitionBase<Arg> {
  readonly skillType: SkillType;
  readonly requiredCost: readonly DiceType[];
  readonly triggerOn: null;
}

export interface RollModifier {
  readonly eventWho: 0 | 1;
  fixDice(...dice: DiceType[]): void;
  addRerollCount(count: number): void;
}

export interface UseDiceModifier {
  readonly eventWho: 0 | 1;
  readonly currentAction: ActionInfo;
  readonly currentCost: readonly DiceType[];
  readonly currentFast: boolean;
  addCost(type: DiceType, count: number): void;
  deductCost(type: DiceType, count: number): void;
  setFastAction(): void;
}

export class UseDiceModifierImpl implements UseDiceModifier {
  private _caller: CharacterState | EntityState | null = null;
  private _cost: DiceType[];
  private _deductedCost: (readonly [DiceType, number])[];
  private _fast: boolean;
  private log = "";

  setCaller(caller: CharacterState | EntityState) {
    this._caller = caller;
  }

  constructor(private readonly _action: ActionInfo) {
    this._cost = [..._action.cost];
    this._deductedCost = [];
    this._fast = _action.fast;
  }
  get eventWho() {
    return this._action.who;
  }

  get currentAction(): ActionInfo & { log: string } {
    return {
      ...this._action,
      cost: this.currentCost,
      fast: this.currentFast,
      log: this.log,
    }
  }
  get currentCost() {
    const proj = (type: DiceType): number => {
      if (type == DiceType.Omni) return 100;
      else return type;
    };
    const deducted = this._deductedCost.toSorted(([a], [b]) => proj(a) - proj(b));
    const finalCost = [...this._cost];
    for (const [type, count] of deducted) {
      if (type === DiceType.Omni) {
        for (let i = 0; i < count; i++) {
          finalCost.pop();
        }
      }
      else {
        for (let i = 0; i < count; i++) {
          const idx = finalCost.lastIndexOf(type);
          if (idx === -1) {
            // console.warn("Potential error: deducting non-exist dice type");
            continue;
          }
          finalCost.splice(idx, 1);
        }
      }
    }
    return finalCost;
  }
  get currentFast() {
    return this._fast;
  }
  addCost(type: DiceType, count: number) {
    if (this._caller === null) {
      throw new Error("caller not set or no damageInfo provided");
    }
    this.log += `${this._caller.definition.type} ${this._caller.id} (defId = ${this._caller.definition.id}) add ${count} diceType(${type}) to cost.\n`;
    this._cost.push(...new Array<DiceType>(count).fill(type));
  }
  deductCost(type: DiceType, count: number) {
    if (this._caller === null) {
      throw new Error("caller not set or no damageInfo provided");
    }
    this.log += `${this._caller.definition.type} ${this._caller.id} (defId = ${this._caller.definition.id}) deduct ${count} diceType(${type}) from cost.\n`;
    this._deductedCost.push([type, count]);
  }
  setFastAction(): void {
    if (this._caller === null) {
      throw new Error("caller not set or no damageInfo provided");
    }
    if (this._fast) {
      console.warn("Potential error: fast action already set");
    }
    this.log += `${this._caller.definition.type} ${this._caller.id} (defId = ${this._caller.definition.id}) set fast action.\n`;
    this._fast = true;
  }
}

export interface DamageModifier0 {
  readonly damageInfo: DamageInfo;
  changeDamageType(type: DamageType): void;
}

export interface DamageModifier1 {
  readonly damageInfo: DamageInfo;
  increaseDamage(value: number): void;
  multiplyDamage(multiplier: number): void;
  decreaseDamage(value: number): void;
}

export class DamageModifierImpl implements DamageModifier0, DamageModifier1 {
  private _caller: CharacterState | EntityState | null = null;
  constructor(private readonly _damageInfo?: DamageInfo) {}
  private newDamageType: DamageType | null = null;
  private increased = 0;
  private multiplier = 1;
  private decreased = 0;
  private log = "";

  setCaller(caller: CharacterState | EntityState) {
    this._caller = caller;
  }

  changeDamageType(type: DamageType) {
    if (this._caller === null || typeof this._damageInfo === "undefined") {
      throw new Error("caller not set or no damageInfo provided");
    }
    this.log += `${this._caller.definition.type} ${this._caller.id} (defId = ${this._caller.definition.id}) change damage type from ${this._damageInfo.type} to ${type}.\n`;
    if (this.newDamageType !== null) {
      console.warn("Potential error: damage type already changed");
    }
    this.newDamageType = type;
  }
  increaseDamage(value: number) {
    if (this._caller === null || typeof this._damageInfo === "undefined") {
      throw new Error("caller not set or no damageInfo provided");
    }
    this.log += `${this._caller.definition.type} ${this._caller.id} (defId = ${this._caller.definition.id}) increase damage by ${value}.\n`;
    this.increased += value;
  }
  multiplyDamage(multiplier: number) {
    if (this._caller === null || typeof this._damageInfo === "undefined") {
      throw new Error("caller not set or no damageInfo provided");
    }
    this.log += `${this._caller.definition.type} ${this._caller.id} (defId = ${this._caller.definition.id}) multiply damage by ${multiplier}.\n`;
    this.multiplier *= multiplier;
  }
  decreaseDamage(value: number) {
    if (this._caller === null || typeof this._damageInfo === "undefined") {
      throw new Error("caller not set or no damageInfo provided");
    }
    this.log += `${this._caller.definition.type} ${this._caller.id} (defId = ${this._caller.definition.id}) decrease damage by ${value}.\n`;
    this.decreased += value;
  }

  get damageInfo(): DamageInfo & { log: string } {
    return this._damageInfo
      ? {
          ...this._damageInfo,
          type: this.newDamageType ?? this._damageInfo.type,
          value: Math.ceil(
            (this._damageInfo.value + this.increased) * this.multiplier -
              this.decreased,
          ),
          log: this.log,
        }
      : (void 0 as any);
  }
}

export interface DefeatedModifier {
  readonly damageInfo: DamageInfo;
  immune(): void;
}

type SyncEventMap = {
  onRoll: RollModifier;
  onBeforeUseDice: UseDiceModifier;
  onBeforeDamage0: DamageModifier0;
  onBeforeDamage1: DamageModifier1;
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
  cost: readonly DiceType[];
  fast: boolean;
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

export type EventArg<E extends EventNames> = E extends keyof SyncEventMap
  ? SyncEventMap[E]
  : E extends keyof AsyncEventMap
    ? AsyncEventMap[E] & { state: GameState } // 引发事件时的游戏状态
    : never;

export type EventExt<E extends EventNames> = E extends keyof SyncEventMap
  ? EventArg<E>
  : E extends keyof AsyncEventMap
    ? {
        eventArg: EventArg<E>;
      }
    : never;

type InSkillEventPayload = {
  [E in keyof AsyncEventMap]: readonly [eventName: E, eventArg: EventArg<E>];
}[keyof AsyncEventMap];

export type AsyncRequest =
  | readonly [
      name: "requestSwitchCards",
      arg: { readonly who: 0 | 1; readonly via: SkillInfo },
    ]
  | readonly [
      name: "requestReroll",
      arg: {
        readonly who: 0 | 1;
        readonly via: SkillInfo;
        readonly times: number;
      },
    ]
  | readonly [
      name: "requestUseSkill",
      arg: { readonly via: SkillInfo; readonly requestingSkillId: number },
    ];

export type DeferredAction = InSkillEventPayload | AsyncRequest;

export type TriggeredSkillFilter<E extends EventNames> = (
  state: GameState,
  caller: CharacterState | EntityState,
  arg: EventArg<E>,
) => boolean;

export type TriggeredSkillDefinition<E extends EventNames = EventNames> =
  SkillDefinitionBase<EventArg<E>> & {
    readonly skillType: null;
    readonly triggerOn: E;
    readonly filter: TriggeredSkillFilter<E>;
    readonly requiredCost: readonly [];
  };

export type SkillDefinition =
  | InitiativeSkillDefinition
  | InitiativeSkillDefinition<CardTarget>
  | TriggeredSkillDefinition;

export function useSyncSkill<E extends keyof SyncEventMap>(
  state: GameState,
  event: E,
  argFn: (caller: CharacterState | EntityState) => EventArg<E>,
  requestBy?: SkillInfo,
): GameState {
  const entities = allEntities(state);
  const infos = entities
    .flatMap((e) =>
      e.definition.skills
        .filter((s) => s.triggerOn === event)
        .map((s) => [e, s] as const),
    )
    .map<SkillInfo>(([e, s]) => ({
      caller: e,
      definition: s,
      fromCard: null,
      requestBy: requestBy ?? null,
    }));
  for (const info of infos) {
    const arg = argFn(info.caller);
    if ("filter" in info.definition && !(0, info.definition.filter)(state, info.caller, arg)) {
      continue;
    }
    const desc = info.definition.action as SkillDescription<EventArg<E>>;
    [state] = desc(state, info, arg);
  }
  return state;
}
