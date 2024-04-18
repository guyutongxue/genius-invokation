// Copyright (C) 2024 Guyutongxue
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { DamageType, DiceType, Reaction } from "@gi-tcg/typings";
import {
  AnyState,
  CardState,
  CharacterState,
  EntityState,
  GameState,
  stringifyState,
} from "./state";
import { CardTag, PlayCardSkillDefinition } from "./card";
import {
  REACTION_RELATIVES,
  getReaction,
  isReactionRelatedTo,
  isReactionSwirl,
} from "../base/reaction";
import { CharacterDefinition } from "./character";
import { GiTcgCoreInternalError } from "../error";
import { UsagePerRoundVariableNames } from "./entity";
import { IDetailLogger } from "../log";

export interface SkillDefinitionBase<Arg> {
  readonly __definition: "skills";
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
  readonly gainEnergy: boolean;
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
  /** @internal */
  readonly logger?: IDetailLogger;
}

export interface DamageInfo {
  readonly type: Exclude<DamageType, DamageType.Heal | DamageType.Revive>;
  readonly value: number;
  readonly source: CharacterState | EntityState;
  readonly via: SkillInfo;
  readonly target: CharacterState;
  readonly causeDefeated: boolean;
  readonly fromReaction: Reaction | null;
  readonly roundNumber: number;
  readonly log?: string;
}

export interface HealInfo {
  readonly type: DamageType.Heal | DamageType.Revive;
  readonly expectedValue: number;
  readonly value: number;
  readonly source: CharacterState | EntityState;
  readonly via: SkillInfo;
  readonly target: CharacterState;
  readonly fromReaction: null;
  readonly causeDefeated: false;
  readonly roundNumber: number;
  readonly log?: string;
}

export interface ReactionInfo {
  readonly type: Reaction;
  readonly via: SkillInfo;
  readonly target: CharacterState;
  readonly fromDamage?: DamageInfo;
}

export interface UseSkillInfo {
  readonly type: "useSkill";
  readonly who: 0 | 1;
  readonly skill: SkillInfo;
  readonly preview: GameState;
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

  toString() {
    return "";
  }
}

export class PlayerEventArg extends EventArg {
  constructor(
    state: GameState,
    public readonly who: 0 | 1,
  ) {
    super(state);
  }
  toString() {
    return `player ${this.who}`
  }
}

export class ModifyRollEventArg extends PlayerEventArg {
  _fixedDice: DiceType[] = [];
  _extraRerollCount = 0;
  _log = "";
  fixDice(type: DiceType, count: number): void {
    this._log += `${stringifyState(this.caller)} fix ${count} [dice:${type}].\n`;
    this._fixedDice.push(...Array(count).fill(type));
  }

  addRerollCount(count: number): void {
    this._log += `${stringifyState(this.caller)} add reroll count ${count}.\n`;
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
  toString() {
    let text: string;
    switch (this.action.type) {
      case "useSkill":
        text = `use skill [skill:${this.action.skill.definition.id}]`;
        break;
      case "playCard":
        text = `play card ${stringifyState(this.action.card)}`;
        break;
      case "switchActive":
        text = `switch active character to ${stringifyState(this.action.to)}`;
        break;
      case "elementalTuning":
        text = `elemental tuning [dice:${this.action.result}]`;
        break;
      case "declareEnd":
        text = "declare end";
        break;
      default:
        text = "unknown action";
    }
    return `${this.action.who} ${text}, cost: ${JSON.stringify(this.action.cost)}, fast: ${this.action.fast}`
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
  isSkillOrTalentOf(
    character: CharacterState,
    skillType?: CommonSkillType,
  ): boolean {
    if (this.action.type === "useSkill") {
      const skillDefId = this.action.skill.definition.id;
      return !!character.definition.initiativeSkills.find(
        (def) =>
          def.id === skillDefId && (!skillType || def.skillType === skillType),
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
    // 消耗相同骰子时，只考虑“任意元素骰”的减费
    if (this._cost.length === 0 || this._cost.includes(DiceType.Same)) {
      let totalCount = this._cost.length;
      for (const [type, count] of this._deductedCost) {
        if (type === DiceType.Omni) {
          totalCount = Math.max(0, totalCount - count);
        }
      }
      const result: DiceType[] = [];
      for (let i = 0; i < totalCount; i++) {
        result.push(DiceType.Same);
      }
      return result;
    }
    // 否则，在骰子需求列表中，先考察有色元素骰，再考虑无色骰子
    const result = [...this._cost];
    // 对于所有减骰效果，优先考虑无色元素，其次是有色元素，最后是任意元素
    const allDeduction = this._deductedCost
      .map(([type, count]) => [type, count] as [DiceType, number])
      .toSorted(([a], [b]) => a - b);
    for (const diceType of [
      DiceType.Cryo,
      DiceType.Hydro,
      DiceType.Pyro,
      DiceType.Electro,
      DiceType.Anemo,
      DiceType.Geo,
      DiceType.Dendro,
      DiceType.Void,
    ]) {
      for (;;) {
        const index = result.indexOf(diceType);
        if (index === -1) {
          break;
        }
        const deductionIndex = allDeduction.findIndex(([type]) => {
          if (diceType === DiceType.Void) {
            return true;
          } else {
            return type === diceType || type === DiceType.Omni;
          }
        });
        if (deductionIndex === -1) {
          break;
        }
        const deduction = allDeduction[deductionIndex];
        deduction[1]--;
        if (deduction[1] === 0) {
          allDeduction.splice(deductionIndex, 1);
        }
        result.splice(index, 1);
      }
    }
    return result;
  }
  isFast() {
    return this._fast;
  }
  canDeductCost() {
    return this.cost.length > 0;
  }
  canDeductCostOfType(diceType: DiceType) {
    return this.cost.includes(diceType) || this.cost.includes(DiceType.Void);
  }

  addCost(type: DiceType, count: number) {
    this._log += `${stringifyState(this.caller)} add ${count} [dice:${type}] to cost.\n`;
    this._cost.push(...new Array<DiceType>(count).fill(type));
  }
  deductCost(type: DiceType, count: number) {
    this._log += `${stringifyState(this.caller)} deduct ${count} [dice:${type}] from cost.\n`;
    this._deductedCost.push([type, count]);
  }
  setFastAction(): void {
    if (this._fast) {
      console.warn("Potential error: fast action already set");
    }
    this._log += `${stringifyState(this.caller)} set fast action.\n`;
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
  toString() {
    let result = `player ${this.switchInfo.who}, switch from ${stringifyState(this.switchInfo.from)} to ${stringifyState(this.switchInfo.to)}`;
    if (this.switchInfo.via) {
      result += `, via skill [skill:${this.switchInfo.via.definition.id}]`;
    }
    return result;
  }
}

export class DamageOrHealEventArg<
  InfoT extends DamageInfo | HealInfo,
> extends EventArg {
  constructor(
    state: GameState,
    private readonly _damageInfo: InfoT,
  ) {
    super(state);
  }
  toString() {
    return stringifyDamageInfo(this.damageInfo).split('\n')[0];
  }

  get damageInfo() {
    return this._damageInfo;
  }
  isDamageTypeDamage() {
    return !this.isDamageTypeHeal();
  }
  isDamageTypeHeal() {
    return (
      this._damageInfo.type === DamageType.Heal ||
      this._damageInfo.type === DamageType.Revive
    );
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
    if (!this.isDamageTypeDamage()) {
      return null;
    }
    return getReaction(this.damageInfo as DamageInfo);
  }
  isReactionRelatedTo(target: DamageType): boolean {
    if (!this.isDamageTypeDamage()) {
      return false;
    }
    return isReactionRelatedTo(this.damageInfo as DamageInfo, target);
  }
  isSwirl():
    | DamageType.Cryo
    | DamageType.Hydro
    | DamageType.Pyro
    | DamageType.Electro
    | null {
    if (!this.isDamageTypeDamage()) {
      return null;
    }
    return isReactionSwirl(this.damageInfo as DamageInfo);
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

export class ModifyDamage1EventArg<
  InfoT extends DamageInfo,
> extends DamageOrHealEventArg<InfoT> {
  private _increased = 0;
  private _multiplier = 1;
  private _decreased = 0;
  protected _log = super.damageInfo.log ?? "";

  increaseDamage(value: number) {
    this._log += `${stringifyState(this.caller)} increase damage by ${value}.\n`;
    this._increased += value;
  }
  multiplyDamage(multiplier: number) {
    this._log += `${stringifyState(this.caller)} multiply damage by ${multiplier}.\n`;
    this._multiplier *= multiplier;
  }
  decreaseDamage(value: number) {
    this._log += `${stringifyState(this.caller)} decrease damage by ${value}.\n`;
    this._decreased += value;
  }

  override get damageInfo(): InfoT {
    const damageInfo = super.damageInfo;
    const value = Math.max(
      0,
      Math.ceil(
        (damageInfo.value + this._increased) * this._multiplier -
          this._decreased,
      ),
    );
    return {
      ...damageInfo,
      value,
      causeDefeated: damageInfo.target.variables.health <= value,
      log: this._log,
    };
  }
}

export class ModifyDamage0EventArg<
  InfoT extends DamageInfo,
> extends ModifyDamage1EventArg<InfoT> {
  private _newDamageType: DamageType | null = null;

  changeDamageType(type: DamageType) {
    this._log += `${stringifyState(this.caller)} change damage type from [damage:${super.damageInfo.type}] to [damage:${type}].\n`;
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

export class EntityEventArg extends EventArg {
  constructor(
    state: GameState,
    public readonly entity: CharacterState | EntityState,
  ) {
    super(state);
  }
  toString(): string {
    return stringifyState(this.entity);
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
  toString(): string {
    return `${super.toString()}, overrided: ${!!this.enterInfo.overrided}`
  }
}

export class CharacterEventArg extends EventArg {
  constructor(
    state: GameState,
    public readonly character: CharacterState,
  ) {
    super(state);
  }
  toString() {
    return stringifyState(this.character);
  }
}

export class ReactionEventArg extends CharacterEventArg {
  constructor(
    state: GameState,
    public readonly reactionInfo: ReactionInfo,
  ) {
    super(state, reactionInfo.target);
  }

  get caller() {
    return this.reactionInfo.via.caller;
  }
  get target() {
    return this.reactionInfo.target;
  }
  get type() {
    return this.reactionInfo.type;
  }

  relatedTo(target: DamageType): boolean {
    return REACTION_RELATIVES[this.type].includes(target);
  }
  toString(): string {
    return `[reaction:${this.reactionInfo.type}] occurred on ${stringifyState(this.reactionInfo.target)} via skill [skill:${this.reactionInfo.via.definition.id}]`;
  }
}

export interface ImmuneInfo {
  skill: SkillInfo;
  newHealth: number;
}

export class ZeroHealthEventArg extends ModifyDamage1EventArg<DamageInfo> {
  _immuneInfo: null | ImmuneInfo = null;
  _log = "";

  immune(newHealth: number) {
    this._log += `${stringifyState(this.caller)} makes the character immune to defeated, and heals him to ${newHealth}.\n`;
    this._immuneInfo = {
      skill: this._currentSkillInfo!,
      newHealth,
    };
  }

  override get damageInfo(): DamageInfo {
    const damageInfo = super.damageInfo;
    return {
      ...damageInfo,
      causeDefeated: damageInfo.causeDefeated && this._immuneInfo === null,
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

  replaceAction: EventArg,

  onBeforeAction: PlayerEventArg,
  modifyAction: ModifyActionEventArg,
  onAction: ActionEventArg,

  onSwitchActive: SwitchActiveEventArg,
  onReaction: ReactionEventArg,

  modifyDamage0: ModifyDamage0EventArg,
  modifyDamage1: ModifyDamage1EventArg,
  onDamageOrHeal: DamageOrHealEventArg,

  onEnter: EnterEventArg,
  onDispose: EntityEventArg,

  modifyZeroHealth: ZeroHealthEventArg,
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
    public readonly who: 0 | 1,
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

export interface TriggeredSkillDefinition<E extends EventNames = EventNames>
  extends SkillDefinitionBase<EventArgOf<E>> {
  readonly skillType: null;
  readonly triggerOn: E;
  readonly filter: TriggeredSkillFilter<E>;
  readonly requiredCost: readonly [];
  readonly gainEnergy: false;
  readonly usagePerRoundVariableName: UsagePerRoundVariableNames | null;
}

export type SkillDefinition =
  | InitiativeSkillDefinition
  | PlayCardSkillDefinition
  | TriggeredSkillDefinition;

export function stringifyDamageInfo(damage: DamageInfo | HealInfo): string {
  if (damage.type === DamageType.Heal || damage.type === DamageType.Revive) {
    let result = `${stringifyState(damage.source)} heal ${damage.value} to ${stringifyState(damage.target)}, via skill [skill:${damage.via.definition.id}]`;
    if (damage.type === DamageType.Revive) {
      result += ` (revive)`;
    }
    return result;
  } else {
    let result = `${stringifyState(damage.source)} deal ${damage.value} [damage:${damage.type}] to ${stringifyState(damage.target)}, via skill [skill:${damage.via.definition.id}`;
    if ("log" in damage) {
      result += `, damage modify log:\n${damage.log}`
    }
    return result;
  }
}
