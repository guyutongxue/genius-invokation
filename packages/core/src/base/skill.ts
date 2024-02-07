import { DamageType, DiceType, Reaction } from "@gi-tcg/typings";
import {
  AnyState,
  CardState,
  CharacterState,
  EntityState,
  GameState,
} from "./state";
import { CardTag, PlayCardSkillDefinition } from "./card";
import {
  getReaction,
  isReactionRelatedTo,
  isReactionSwirl,
} from "../base/reaction";
import { CharacterDefinition } from "./character";
import { GiTcgCoreInternalError } from "../error";

export interface SkillDefinitionBase<Arg> {
  readonly type: "skill";
  readonly id: number;
  readonly action: SkillDescription<Arg>;
}

type SkillResult = readonly [GameState, EventAndRequest[]];

export type SkillDescription<Arg> = (
  state: GameState,
  skillInfo: SkillInfo,
  arg: Arg,
) => SkillResult;

export type CommonSkillType = "normal" | "elemental" | "burst";
export type SkillType = CommonSkillType | "card";

export interface InitiativeSkillDefinition<Arg = void>
  extends SkillDefinitionBase<Arg> {
  readonly skillType: SkillType;
  readonly requiredCost: readonly DiceType[];
  readonly triggerOn: null;
}

export interface SkillInfo {
  readonly caller: CharacterState | EntityState;
  /**
   * 仅当此技能是作为卡牌描述的一部分时才有值。
   */
  readonly fromCard: CardState | null;
  readonly definition: SkillDefinition;
  /**
   * 若此技能通过 `requestSkill` 如准备技能或天赋牌触发，
   * 则此字段指定上述技能的 `SkillInfo`
   */
  readonly requestBy: SkillInfo | null;
  readonly charged: boolean;
  readonly plunging: boolean;
}

export interface DamageInfo {
  readonly type: DamageType;
  readonly value: number;
  readonly source: CharacterState | EntityState;
  readonly via: SkillInfo;
  readonly target: CharacterState;
  readonly fromReaction: Reaction | null;
  readonly log?: string;
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
  readonly targets: AnyState[];
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

export type ActionInfoBase =
  | UseSkillInfo
  | PlayCardInfo
  | SwitchActiveInfo
  | ElementalTuningInfo
  | DeclareEndInfo;

export type WithActionDetail<T extends ActionInfoBase> = T & {
  readonly cost: readonly DiceType[];
  readonly fast: boolean;
  readonly log?: string;
};
export type ActionInfo = WithActionDetail<ActionInfoBase>;

export interface EnterEventInfo {
  readonly newState: EntityState | CharacterState;
  readonly overrided: EntityState | null;
}

export class EventArg {
  _currentSkillInfo: SkillInfo | null = null;
  constructor(public readonly _state: GameState) {}

  protected get caller(): EntityState | CharacterState {
    if (this._currentSkillInfo === null) {
      throw new GiTcgCoreInternalError("EventArg caller not set");
    }
    return this._currentSkillInfo.caller;
  }
}

export class PlayerEventArg extends EventArg {
  constructor(
    state: GameState,
    public readonly who: 0 | 1,
  ) {
    super(state);
  }
}

export class ModifyRollEventArg extends PlayerEventArg {
  _fixedDice: DiceType[] = [];
  _extraRerollCount = 0;
  _log = "";
  fixDice(type: DiceType, count: number): void {
    this._log += `${this.caller.definition.type} ${this.caller.id} (defId = ${this.caller.definition.id}) fix ${count} dice ${type}.\n`;
    this._fixedDice.push(...Array(count).fill(type));
  }

  addRerollCount(count: number): void {
    this._log += `${this.caller.definition.type} ${this.caller.id} (defId = ${this.caller.definition.id}) add reroll count ${count}.\n`;
    this._extraRerollCount += count;
  }
}

export class ActionEventArg<
  InfoT extends ActionInfoBase,
> extends PlayerEventArg {
  constructor(
    state: GameState,
    private readonly _action: WithActionDetail<InfoT>,
  ) {
    super(state, _action.who);
  }

  get action() {
    return this._action;
  }

  isSwitchActive(): this is ActionEventArg<SwitchActiveInfo> {
    return this.action.type === "switchActive";
  }
  isPlayCard(): this is ActionEventArg<PlayCardInfo> {
    return this.action.type === "playCard";
  }
  isUseSkill(): this is ActionEventArg<UseSkillInfo> {
    return this.action.type === "useSkill";
  }
  isDeclareEnd(): this is ActionEventArg<DeclareEndInfo> {
    return this.action.type === "declareEnd";
  }
  isSkillOrTalentOf(character: CharacterState): boolean {
    if (this.action.type === "useSkill") {
      const skillDefId = this.action.skill.definition.id;
      return !!character.definition.initiativeSkills.find(
        (def) => def.id === skillDefId,
      );
    } else if (this.action.type === "playCard") {
      return !!(
        this.action.card.definition.tags.includes("talent") &&
        this.action.targets.find((target) => target.id === character.id)
      );
    } else {
      return false;
    }
  }

  isSkillType(skillType: CommonSkillType): boolean {
    if (this.isUseSkill()) {
      return this.action.skill.definition.skillType === skillType;
    } else {
      return false;
    }
  }
  isChargedAttack(): this is ActionEventArg<UseSkillInfo> {
    return this.isUseSkill() && this.action.skill.charged;
  }
  isPlungingAttack(): this is ActionEventArg<UseSkillInfo> {
    return this.isUseSkill() && this.action.skill.plunging;
  }
  hasCardTag(tag: CardTag) {
    if (this.action.type === "playCard") {
      return this.action.card.definition.tags.includes(tag);
    } else {
      return false;
    }
  }
  hasOneOfCardTag(...tags: CardTag[]) {
    if (this.action.type === "playCard") {
      const action: PlayCardInfo = this.action;
      return tags.some((tag) => action.card.definition.tags.includes(tag));
    } else {
      return false;
    }
  }
}

export class ModifyActionEventArg<
  InfoT extends ActionInfoBase,
> extends ActionEventArg<InfoT> {
  private _cost: DiceType[];
  private _deductedCost: (readonly [DiceType, number])[];
  private _fast: boolean;
  private _log = "";

  constructor(state: GameState, action: WithActionDetail<InfoT>) {
    super(state, action);
    this._cost = [...action.cost];
    this._deductedCost = [];
    this._fast = action.fast;
  }

  override get action(): WithActionDetail<InfoT> {
    return {
      ...super.action,
      cost: this.cost,
      fast: this.isFast(),
      log: this._log,
    };
  }

  get cost() {
    const proj = (type: DiceType): number => {
      if (type == DiceType.Omni) return 100;
      else return type;
    };
    const deducted = this._deductedCost.toSorted(
      ([a], [b]) => proj(a) - proj(b),
    );
    const finalCost = [...this._cost];
    for (const [type, count] of deducted) {
      if (type === DiceType.Omni) {
        for (let i = 0; i < count; i++) {
          finalCost.pop();
        }
      } else {
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
  isFast() {
    return this._fast;
  }
  canDeductCost() {
    return this.action.cost.length > 0;
  }
  canDeductCostOfType(diceType: DiceType) {
    return this.action.cost.includes(diceType);
  }

  addCost(type: DiceType, count: number) {
    this._log += `${this.caller.definition.type} ${this.caller.id} (defId = ${this.caller.definition.id}) add ${count} diceType(${type}) to cost.\n`;
    this._cost.push(...new Array<DiceType>(count).fill(type));
  }
  deductCost(type: DiceType, count: number) {
    this._log += `${this.caller.definition.type} ${this.caller.id} (defId = ${this.caller.definition.id}) deduct ${count} diceType(${type}) from cost.\n`;
    this._deductedCost.push([type, count]);
  }
  setFastAction(): void {
    if (this._fast) {
      console.warn("Potential error: fast action already set");
    }
    this._log += `${this.caller.definition.type} ${this.caller.id} (defId = ${this.caller.definition.id}) set fast action.\n`;
    this._fast = true;
  }
}

export class SwitchActiveEventArg extends EventArg {
  constructor(
    state: GameState,
    public readonly switchInfo: SwitchActiveInfo,
  ) {
    super(state);
  }
}

export class DamageEventArg<InfoT extends DamageInfo> extends EventArg {
  constructor(
    state: GameState,
    private readonly _damageInfo: InfoT,
  ) {
    super(state);
  }
  get damageInfo() {
    return this._damageInfo;
  }

  get source() {
    return this.damageInfo.source;
  }
  get target() {
    return this.damageInfo.target;
  }
  get type() {
    return this.damageInfo.type;
  }
  get value() {
    return this.damageInfo.value;
  }
  get via() {
    return this.damageInfo.via;
  }
  getReaction(): Reaction | null {
    return getReaction(this.damageInfo);
  }
  isReactionRelatedTo(target: DamageType): boolean {
    return isReactionRelatedTo(this.damageInfo, target);
  }
  isSwirl():
    | DamageType.Cryo
    | DamageType.Hydro
    | DamageType.Pyro
    | DamageType.Electro
    | null {
    return isReactionSwirl(this.damageInfo);
  }
  viaSkillType(skillType: CommonSkillType): boolean {
    return this.via.definition.skillType === skillType;
  }
  viaChargedAttack(): boolean {
    return this.via.charged;
  }
  viaPlungingAttack(): boolean {
    return this.via.plunging;
  }
  log() {
    return this.damageInfo.log ?? "";
  }
}

class ModifyDamage1EventArg<
  InfoT extends DamageInfo,
> extends DamageEventArg<InfoT> {
  private _increased = 0;
  private _multiplier = 1;
  private _decreased = 0;
  protected _log = "";

  increaseDamage(value: number) {
    this._log += `${this.caller.definition.type} ${this.caller.id} (defId = ${this.caller.definition.id}) increase damage by ${value}.\n`;
    this._increased += value;
  }
  multiplyDamage(multiplier: number) {
    this._log += `${this.caller.definition.type} ${this.caller.id} (defId = ${this.caller.definition.id}) multiply damage by ${multiplier}.\n`;
    this._multiplier *= multiplier;
  }
  decreaseDamage(value: number) {
    this._log += `${this.caller.definition.type} ${this.caller.id} (defId = ${this.caller.definition.id}) decrease damage by ${value}.\n`;
    this._decreased += value;
  }

  override get damageInfo(): InfoT {
    return {
      ...super.damageInfo,
      value: Math.max(
        0,
        Math.ceil(
          (super.damageInfo.value + this._increased) * this._multiplier -
            this._decreased,
        ),
      ),
      log: this._log,
    };
  }
}

export class ModifyDamage0EventArg<
  InfoT extends DamageInfo,
> extends ModifyDamage1EventArg<InfoT> {
  private _newDamageType: DamageType | null = null;

  changeDamageType(type: DamageType) {
    this._log += `${this.caller.definition.type} ${this.caller.id} (defId = ${this.caller.definition.id}) change damage type from ${super.damageInfo.type} to ${type}.\n`;
    if (this._newDamageType !== null) {
      console.warn("Potential error: damage type already changed");
    }
    this._newDamageType = type;
  }

  override get damageInfo(): InfoT {
    return {
      ...super.damageInfo,
      type: this._newDamageType ?? super.damageInfo.type,
    };
  }
}

class HealEventArg extends EventArg {
  constructor(
    state: GameState,
    public readonly healInfo: HealInfo,
  ) {
    super(state);
  }
  get target() {
    return this.healInfo.target;
  }
  get type(): DamageType.Heal {
    return DamageType.Heal;
  }
  get value() {
    return this.healInfo.finalValue;
  }
  log() {
    return "";
  }
}

class ReactionEventArg extends EventArg {
  constructor(
    state: GameState,
    public readonly reactionInfo: ReactionInfo,
  ) {
    super(state);
  }
}

export class EntityEventArg extends EventArg {
  constructor(
    state: GameState,
    public readonly entity: CharacterState | EntityState,
  ) {
    super(state);
  }
}

class EnterEventArg extends EntityEventArg {
  constructor(
    state: GameState,
    private readonly enterInfo: EnterEventInfo,
  ) {
    super(state, enterInfo.newState);
  }

  get overrided() {
    return this.enterInfo.overrided;
  }
}

export class CharacterEventArg extends EventArg {
  constructor(
    state: GameState,
    public readonly character: CharacterState,
  ) {
    super(state);
  }
}

export interface ImmuneInfo {
  skill: SkillInfo;
  newHealth: number;
}

export class ZeroHealthEventArg extends CharacterEventArg {
  _immuneInfo: null | ImmuneInfo = null;
  _log = "";

  immune(newHealth: number) {
    this._log += `${this.caller.definition.type} ${this.caller.id} (defId = ${this.caller.definition.id}) immune to defeated, and heal it to ${newHealth}.\n`;
    this._immuneInfo = {
      skill: this._currentSkillInfo!,
      newHealth,
    };
  }
}

export class ReplaceCharacterDefinitionEventArg extends CharacterEventArg {
  constructor(
    state: GameState,
    character: CharacterState,
    public readonly oldDefinition: CharacterDefinition,
    public readonly newDefinition: CharacterDefinition,
  ) {
    super(state, character);
  }
}

export const EVENT_MAP = {
  onBattleBegin: EventArg,

  modifyRoll: ModifyRollEventArg,
  onActionPhase: EventArg,
  onEndPhase: EventArg,

  replaceAction: PlayerEventArg,

  onBeforeAction: PlayerEventArg,
  modifyAction: ModifyActionEventArg,
  onAction: ActionEventArg,

  onSwitchActive: SwitchActiveEventArg,

  modifyDamage0: ModifyDamage0EventArg,
  modifyDamage1: ModifyDamage1EventArg,
  onDamage: DamageEventArg,
  onHeal: HealEventArg,
  onReaction: ReactionEventArg,

  onEnter: EnterEventArg,
  onDispose: EntityEventArg,

  modifyZeroHealth: ZeroHealthEventArg,
  onDefeated: CharacterEventArg,
  onRevive: CharacterEventArg,
  onReplaceCharacterDefinition: ReplaceCharacterDefinitionEventArg,
} satisfies Record<string, new (...args: any[]) => EventArg>;

export type EventMap = typeof EVENT_MAP;
export type EventNames = keyof EventMap;

export type InlineEventNames = "modifyDamage0" | "modifyDamage1";

export type EventArgOf<E extends EventNames> = InstanceType<EventMap[E]>;

class RequestArg {
  constructor(public readonly via: SkillInfo) {}
}

class SwitchHandsRequestArg extends RequestArg {
  constructor(
    via: SkillInfo,
    public readonly who: 0 | 1,
  ) {
    super(via);
  }
}

class RerollRequestArg extends RequestArg {
  constructor(
    via: SkillInfo,
    public readonly who: 0 | 1,
    public readonly times: number,
  ) {
    super(via);
  }
}

class UseSkillRequestArg extends RequestArg {
  constructor(
    requestBy: SkillInfo,
    public readonly caller: CharacterState,
    public readonly requestingSkillId: number,
  ) {
    super(requestBy);
  }
}

const REQUEST_MAP = {
  requestSwitchHands: SwitchHandsRequestArg,
  requestReroll: RerollRequestArg,
  requestUseSkill: UseSkillRequestArg,
} satisfies Record<string, new (...args: any[]) => RequestArg>;
type RequestMap = typeof REQUEST_MAP;
type RequestNames = keyof RequestMap;

export type EventAndRequestNames = EventNames | RequestNames;
type EventAndRequestMap = EventMap & RequestMap;

export type EventAndRequestConstructorArgs<E extends EventAndRequestNames> =
  ConstructorParameters<EventAndRequestMap[E]>;

export type EventAndRequestArgOf<E extends EventAndRequestNames> = InstanceType<
  EventAndRequestMap[E]
>;

export function constructEventAndRequestArg<E extends EventAndRequestNames>(
  event: E,
  ...args: EventAndRequestConstructorArgs<E>
): EventAndRequestArgOf<E> {
  const Ctor = {
    ...EVENT_MAP,
    ...REQUEST_MAP,
  }[event] as new (...args: any[]) => EventAndRequestArgOf<E>;
  return new Ctor(...args);
}

export type EventAndRequest = {
  [E in EventAndRequestNames]: [E, EventAndRequestArgOf<E>];
}[EventAndRequestNames];

export type TriggeredSkillFilter<E extends EventNames> = (
  state: GameState,
  skillInfo: SkillInfo,
  arg: EventArgOf<E>,
) => boolean;

export type TriggeredSkillDefinition<E extends EventNames = EventNames> =
  SkillDefinitionBase<EventArgOf<E>> & {
    readonly skillType: null;
    readonly triggerOn: E;
    readonly filter: TriggeredSkillFilter<E>;
    readonly requiredCost: readonly [];
  };

export type SkillDefinition =
  | InitiativeSkillDefinition
  | PlayCardSkillDefinition
  | TriggeredSkillDefinition;
