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
  REACTION_MAP,
  REACTION_RELATIVES,
  getReaction,
  isReactionRelatedTo,
  isReactionSwirl,
} from "../base/reaction";
import { CharacterDefinition } from "./character";
import { GiTcgCoreInternalError, GiTcgDataError } from "../error";
import { EntityDefinition, UsagePerRoundVariableNames } from "./entity";
import { IDetailLogger } from "../log";
import { InternalNotifyOption } from "../mutator";
import { diceCostOfCard, getEntityArea, mixins } from "../utils";
import { commonInitiativeSkillCheck } from "../builder/skill";

export interface SkillDefinitionBase<Arg> {
  readonly type: "skill";
  readonly id: number;
  readonly action: SkillDescription<Arg>;
  readonly filter: SkillActionFilter<Arg>;
}

export type SkillResult = readonly [GameState, EventAndRequest[]];

export type SkillDescription<Arg> = (
  state: GameState,
  skillInfo: SkillInfo,
  arg: Arg,
) => SkillResult;

export type CommonSkillType = "normal" | "elemental" | "burst" | "technique";
export type SkillType = CommonSkillType | "playCard" | "disposeCard";

export type InitiativeSkillFilter = (
  state: GameState,
  skillInfo: SkillInfo,
  arg?: unknown,
) => boolean;

export interface InitiativeSkillDefinition<Arg = void>
  extends SkillDefinitionBase<Arg> {
  readonly skillType: SkillType;
  readonly requiredCost: readonly DiceType[];
  readonly gainEnergy: boolean;
  readonly prepared: boolean;
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
  /** @internal 技能执行时的日志管理 */
  readonly logger?: IDetailLogger;
  /** @internal 技能执行时发生 notify 的回调 */
  readonly onNotify?: (opt: InternalNotifyOption) => void;
  /** @internal 当访问 setExtensionState 时操作的扩展点 id */
  readonly associatedExtensionId?: number;
}

export interface DamageInfo {
  readonly type: Exclude<DamageType, DamageType.Heal>;
  readonly value: number;
  readonly source: CharacterState | EntityState;
  readonly via: SkillInfo;
  readonly target: CharacterState;
  readonly causeDefeated: boolean;
  readonly fromReaction: Reaction | null;
  readonly log?: string;
}

export type HealKind =
  | "common" // 常规治疗
  | "revive" // 复苏
  | "distribution" // 平衡生命值（水与正义）
  | "increaseMaxHealth"; // 增加最大生命值（吞星之鲸）

export interface HealInfo {
  readonly type: DamageType.Heal;
  readonly expectedValue: number;
  readonly value: number;
  readonly healKind: HealKind;
  readonly source: CharacterState | EntityState;
  readonly via: SkillInfo;
  readonly target: CharacterState;
  readonly fromReaction: null;
  readonly causeDefeated: false;
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
  readonly fromReaction: boolean;
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
  readonly preview?: GameState;
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

  get onTimeState() {
    return this._state;
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
    return `player ${this.who}`;
  }
}

export class ModifyRollEventArg extends PlayerEventArg {
  _fixedDice: DiceType[] = [];
  _extraRerollCount = 0;
  _log = "";
  fixDice(type: DiceType, count: number): void {
    this._log += `${stringifyState(
      this.caller,
    )} fix ${count} [dice:${type}].\n`;
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
    return `${this.action.who} ${text}, cost: ${JSON.stringify(
      this.action.cost,
    )}, fast: ${this.action.fast}`;
  }
  originalDiceCost(): DiceType[] {
    if (this.isUseSkill()) {
      return this.action.skill.definition.requiredCost.filter(
        (d) => d !== DiceType.Energy,
      );
    } else if (this.isPlayCard()) {
      return this.action.card.definition.onPlay.requiredCost.filter(
        (d) => d !== DiceType.Energy,
      );
    } else {
      return [];
    }
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
      const skillDef = this.action.skill.definition;
      return (
        character.definition.initiativeSkills.some(
          (sk) => sk.id === skillDef.id,
        ) &&
        (!skillType || skillDef.skillType === skillType)
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

export class ModifyActionEventArgBase<
  InfoT extends ActionInfoBase,
> extends ActionEventArg<InfoT> {
  protected _cost: DiceType[];
  protected _fast: boolean;
  protected _log = "";

  constructor(state: GameState, action: WithActionDetail<InfoT>) {
    super(state, action);
    this._cost = [...action.cost];
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
    const order = (d: DiceType) => (d === DiceType.Void ? 100 : d);
    return this._cost.toSorted((a, b) => order(a) - order(b));
  }

  isFast() {
    return this._fast;
  }
  canDeductVoidCost() {
    return this.cost.includes(DiceType.Void);
  }
  canDeductCostOfType(type: Exclude<DiceType, DiceType.Omni | DiceType.Void>) {
    return this.cost.includes(type) || this.cost.includes(DiceType.Void);
  }
  canDeductCost() {
    return this.cost.length > 0;
  }
}

export class ModifyAction0EventArg<
  InfoT extends ActionInfoBase,
> extends ModifyActionEventArgBase<InfoT> {
  deductVoidCost(count: number) {
    this._log += `${stringifyState(
      this.caller,
    )} deduct ${count} [dice:0] from cost.\n`;
    for (let i = 0; i < count; i++) {
      const voidIndex = this._cost.indexOf(DiceType.Void);
      if (voidIndex === -1) {
        break;
      }
      this._cost.splice(voidIndex, 1);
    }
  }

  addCost(type: DiceType, count: number) {
    this._log += `${stringifyState(
      this.caller,
    )} add ${count} [dice:${type}] to cost.\n`;
    if (type === DiceType.Omni) {
      // 增加 Omni 类型：假设原本要求为单色*n，增加该类型的元素骰
      const originalCost = this.originalDiceCost();
      const targetType = originalCost[0] ?? DiceType.Same;
      if (originalCost.find((type) => type !== targetType)) {
        throw new GiTcgDataError(
          "Cannot addCost omni to action whose original cost have multiple dice requirement",
        );
      }
      this._cost.push(...new Array<DiceType>(count).fill(targetType));
    } else {
      this._cost.push(...new Array<DiceType>(count).fill(type));
    }
  }
}

export class ModifyAction1EventArg<
  InfoT extends ActionInfoBase,
> extends ModifyAction0EventArg<InfoT> {
  deductCost(type: Exclude<DiceType, DiceType.Omni>, count: number) {
    this._log += `${stringifyState(
      this.caller,
    )} deduct ${count} [dice:${type}] from cost.\n`;
    for (let i = 0; i < count; i++) {
      // 减有色骰子时：先检查此颜色，再检查无色
      const index = this._cost.indexOf(type);
      if (index === -1) {
        const voidIndex = this._cost.indexOf(DiceType.Void);
        if (voidIndex === -1) {
          break;
        }
        this._cost.splice(voidIndex, 1);
      } else {
        this._cost.splice(index, 1);
      }
    }
  }
}

export class ModifyAction2EventArg<
  InfoT extends ActionInfoBase,
> extends ModifyActionEventArgBase<InfoT> {
  deductOmniCost(count: number) {
    this._log += `${stringifyState(
      this.caller,
    )} deduct ${count} [dice:8] from cost.\n`;
    this._cost = this.cost.toSpliced(0, count);
  }
  setFastAction(): void {
    if (this._fast) {
      console.warn("Potential error: fast action already set");
    }
    this._log += `${stringifyState(this.caller)} set fast action.\n`;
    this._fast = true;
  }
}

export class ModifyAction3EventArg<
  InfoT extends ActionInfoBase,
> extends ModifyActionEventArgBase<InfoT> {
  deductAllCost() {
    this._log += `${stringifyState(this.caller)} deduct all cost.\n`;
    this._cost = [];
  }
}

export const GenericModifyActionEventArg = mixins(ModifyActionEventArgBase, [
  ModifyAction0EventArg,
  ModifyAction1EventArg,
  ModifyAction2EventArg,
  ModifyAction3EventArg,
]);

export class SwitchActiveEventArg extends EventArg {
  constructor(
    state: GameState,
    public readonly switchInfo: SwitchActiveInfo,
  ) {
    super(state);
  }
  override toString() {
    let result = `player ${this.switchInfo.who}, switch from ${stringifyState(
      this.switchInfo.from,
    )} to ${stringifyState(this.switchInfo.to)}`;
    if (this.switchInfo.via) {
      result += `, via skill [skill:${this.switchInfo.via.definition.id}]`;
    }
    return result;
  }
}

export class UseSkillEventArg extends PlayerEventArg {
  constructor(
    state: GameState,
    public readonly who: 0 | 1,
    public readonly skill: SkillInfo,
  ) {
    super(state, who);
  }
  override toString(): string {
    return `use skill [skill:${this.skill.definition.id}]`;
  }
  isSkillType(skillType: CommonSkillType): boolean {
    return this.skill.definition.skillType === skillType;
  }
  isChargedAttack(): this is ActionEventArg<UseSkillInfo> {
    return this.skill.charged;
  }
  isPlungingAttack(): this is ActionEventArg<UseSkillInfo> {
    return this.skill.plunging;
  }
}

export class PlayCardEventArg extends PlayerEventArg {
  constructor(
    state: GameState,
    public readonly playCardInfo: PlayCardInfo,
  ) {
    super(state, playCardInfo.who);
  }
  get card() {
    return this.playCardInfo.card;
  }
  override toString() {
    return `play card ${stringifyState(this.playCardInfo.card)}`;
  }
  hasCardTag(tag: CardTag) {
    return this.card.definition.tags.includes(tag);
  }
  hasOneOfCardTag(...tags: CardTag[]) {
    return tags.some((tag) => this.card.definition.tags.includes(tag));
  }
}

export class DisposeOrTuneCardEventArg extends PlayerEventArg {
  constructor(
    state: GameState,
    who: 0 | 1,
    public readonly card: CardState,
    public readonly method: DisposeOrTuneMethod,
  ) {
    super(state, who);
  }

  diceCost() {
    return diceCostOfCard(this.card.definition);
  }
  override toString(): string {
    return `player ${this.who} ${this.method} card ${stringifyState(
      this.card,
    )}`;
  }
}

export class DamageOrHealEventArg<
  InfoT extends DamageInfo | HealInfo,
> extends EventArg {
  public readonly sourceWho: 0 | 1;
  public readonly targetWho: 0 | 1;
  constructor(
    state: GameState,
    private readonly _damageInfo: InfoT,
  ) {
    super(state);
    this.sourceWho = getEntityArea(state, _damageInfo.source.id).who;
    this.targetWho = getEntityArea(state, _damageInfo.target.id).who;
  }
  toString() {
    return stringifyDamageInfo(this.damageInfo).split("\n")[0];
  }

  get damageInfo() {
    return this._damageInfo;
  }
  isDamageTypeDamage() {
    return !this.isDamageTypeHeal();
  }
  isDamageTypeHeal() {
    return this._damageInfo.type === DamageType.Heal;
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

export class ModifyHealEventArg extends DamageOrHealEventArg<HealInfo> {
  private _increased = 0;
  private _decreased = 0;
  private _log = super.damageInfo.log ?? "";
  increaseHeal(value: number) {
    this._log += `${stringifyState(this.caller)} increase heal by ${value}.\n`;
    this._increased += value;
  }
  decreaseHeal(value: number) {
    this._log += `${stringifyState(this.caller)} decrease heal by ${value}.\n`;
    this._decreased += value;
  }
  override get damageInfo(): HealInfo {
    const healInfo = super.damageInfo;
    const expectedValue = Math.max(
      0,
      Math.ceil(healInfo.expectedValue + this._increased - this._decreased),
    );
    const targetLoss =
      healInfo.target.variables.maxHealth - healInfo.target.variables.health;
    const value = Math.min(expectedValue, targetLoss);
    return {
      ...healInfo,
      expectedValue,
      value,
      log: this._log,
    };
  }
}

export class ModifyDamageEventArgBase extends DamageOrHealEventArg<DamageInfo> {
  protected _newDamageType: Exclude<DamageType, DamageType.Heal> | null = null;
  protected _increased = 0;
  protected _multiplied: number | null = null;
  protected _divider = 1;
  protected _decreased = 0;
  protected _log = "";

  override get damageInfo(): DamageInfo {
    const targetHealth = super.damageInfo.target.variables.health;
    const type = this._newDamageType ?? super.damageInfo.type;
    let value = super.damageInfo.value;
    value = value + this._increased; // 加
    const multiplier = (this._multiplied ?? 1) * this._divider;
    value = Math.ceil(value * multiplier); // 乘除
    value = Math.max(0, value - this._decreased); // 减
    return {
      ...super.damageInfo,
      type,
      value,
      causeDefeated: value >= targetHealth,
      log: this._log,
    };
  }
}

export class ModifyDamage0EventArg extends ModifyDamageEventArgBase {
  changeDamageType(type: Exclude<DamageType, DamageType.Heal>) {
    this._log += `${stringifyState(
      this.caller,
    )} change damage type from [damage:${
      super.damageInfo.type
    }] to [damage:${type}].\n`;
    if (this._newDamageType !== null) {
      console.warn("Potential error: damage type already changed");
    }
    this._newDamageType = type;
  }
}

export class ModifyDamageByReactionEventArg extends ModifyDamageEventArgBase {
  increaseDamageByReaction() {
    const damageInfo = super.damageInfo;
    const targetAura = damageInfo.target.variables.aura;
    if (
      damageInfo.type === DamageType.Physical ||
      damageInfo.type === DamageType.Piercing
    ) {
      return;
    }
    const [, reaction] = REACTION_MAP[targetAura][damageInfo.type];
    switch (reaction) {
      case Reaction.Melt:
      case Reaction.Vaporize:
      case Reaction.Overloaded:
        this._increased += 2;
        this._log += `${
          damageInfo.log ?? ""
        }Reaction (${reaction}) increase damage by 2\n`;
        break;
      case Reaction.Superconduct:
      case Reaction.ElectroCharged:
      case Reaction.Frozen:
      case Reaction.CrystallizeCryo:
      case Reaction.CrystallizeHydro:
      case Reaction.CrystallizePyro:
      case Reaction.CrystallizeElectro:
      case Reaction.Burning:
      case Reaction.Bloom:
      case Reaction.Quicken:
        this._increased += 1;
        this._log += `${damageInfo.log}\nReaction (${reaction}) increase damage by 1`;
        break;
      default:
        // do nothing
        break;
    }
  }
}

export class ModifyDamage1EventArg extends ModifyDamageEventArgBase {
  increaseDamage(value: number) {
    this._log += `${stringifyState(
      this.caller,
    )} increase damage by ${value}.\n`;
    this._increased += value;
  }
}

export class ModifyDamage2EventArg extends ModifyDamageEventArgBase {
  multiplyDamage(multiplier: number) {
    this._log += `${stringifyState(
      this.caller,
    )} multiply damage by ${multiplier}.\n`;
    // WTF are u kidding me, mhy?
    this._multiplied = (this._multiplied ?? 0) + multiplier;
  }
  divideDamage(divider: number) {
    this._log += `${stringifyState(
      this.caller,
    )} divide damage by ${divider}.\n`;
    this._divider *= divider;
  }
}

export class ModifyDamage3EventArg extends ModifyDamageEventArgBase {
  decreaseDamage(value: number) {
    this._log += `${stringifyState(
      this.caller,
    )} decrease damage by ${value}.\n`;
    this._decreased += value;
  }
}

export const GenericModifyDamageEventArg = mixins(ModifyDamageEventArgBase, [
  ModifyDamage0EventArg,
  ModifyDamageByReactionEventArg,
  ModifyDamage1EventArg,
  ModifyDamage2EventArg,
  ModifyDamage3EventArg,
]);

export class EntityEventArg extends EventArg {
  public readonly who: 0 | 1;
  constructor(
    state: GameState,
    public readonly entity: CharacterState | EntityState,
  ) {
    super(state);
    this.who = getEntityArea(state, entity.id).who;
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
    return `${super.toString()}, overrided: ${!!this.enterInfo.overrided}`;
  }
}

export class CharacterEventArg extends EventArg {
  public readonly who: 0 | 1;
  constructor(
    state: GameState,
    public readonly character: CharacterState,
  ) {
    super(state);
    this.who = getEntityArea(state, character.id).who;
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

  /** 是否为“角色引发的” */
  viaCommonInitiativeSkill() {
    return commonInitiativeSkillCheck(this.reactionInfo.via);
  }

  relatedTo(target: DamageType): boolean {
    return REACTION_RELATIVES[this.type].includes(target);
  }
  toString(): string {
    return `[reaction:${this.reactionInfo.type}] occurred on ${stringifyState(
      this.reactionInfo.target,
    )} via skill [skill:${this.reactionInfo.via.definition.id}]`;
  }
}

export interface ImmuneInfo {
  skill: SkillInfo;
  newHealth: number;
}

export class ZeroHealthEventArg extends ModifyDamage1EventArg {
  _immuneInfo: null | ImmuneInfo = null;
  _log = "";

  immune(newHealth: number) {
    this._log += `${stringifyState(
      this.caller,
    )} makes the character immune to defeated, and heals him to ${newHealth}.\n`;
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

export class TransformDefinitionEventArg extends EventArg {
  public readonly who: 0 | 1;
  public readonly oldDefinition: CharacterDefinition | EntityDefinition;
  constructor(
    state: GameState,
    public readonly entity: CharacterState | EntityState,
    public readonly newDefinition: CharacterDefinition | EntityDefinition,
  ) {
    super(state);
    const area = getEntityArea(state, entity.id);
    this.who = area.who;
    this.oldDefinition = entity.definition;
  }
}

export class DrawCardEventArg extends PlayerEventArg {
  constructor(
    state: GameState,
    who: 0 | 1,
    public readonly card: CardState,
  ) {
    super(state, who);
  }

  override toString(): string {
    return `player ${this.who} draw card ${stringifyState(this.card)}`;
  }
}

export type DisposeOrTuneMethod =
  | "disposeFromHands"
  | "disposeFromPiles"
  | "elementalTuning";

export class GenerateDiceEventArg extends PlayerEventArg {
  constructor(
    state: GameState,
    who: 0 | 1,
    public readonly via: SkillInfo,
    public readonly dice: DiceType,
  ) {
    super(state, who);
  }

  override toString(): string {
    return `player ${this.who} generate dice [dice:${this.dice}]`;
  }
}

export const EVENT_MAP = {
  onBattleBegin: EventArg,
  onRoundBegin: EventArg,

  modifyRoll: ModifyRollEventArg,
  onActionPhase: EventArg,
  onEndPhase: EventArg,

  replaceAction: EventArg,

  onBeforeAction: PlayerEventArg,
  modifyAction0: ModifyAction0EventArg, // 增骰、减无色
  modifyAction1: ModifyAction1EventArg, // 减有色
  modifyAction2: ModifyAction2EventArg, // 减任意、快速行动
  modifyAction3: ModifyAction3EventArg, // 蒂玛乌斯 & 瓦格纳
  onAction: ActionEventArg,

  onBeforeUseSkill: UseSkillEventArg,
  onUseSkill: UseSkillEventArg,
  onBeforePlayCard: PlayCardEventArg,
  onPlayCard: PlayCardEventArg,
  onDisposeOrTuneCard: DisposeOrTuneCardEventArg,

  onSwitchActive: SwitchActiveEventArg,
  onDrawCard: DrawCardEventArg,
  onReaction: ReactionEventArg,
  onTransformDefinition: TransformDefinitionEventArg,
  onGenerateDice: GenerateDiceEventArg,

  modifyDamage0: ModifyDamage0EventArg, // 类型
  modifyDamage1: ModifyDamage1EventArg, // 加
  modifyDamage2: ModifyDamage2EventArg, // 乘除
  modifyDamage3: ModifyDamage3EventArg, // 减
  modifyHeal: ModifyHealEventArg,
  onDamageOrHeal: DamageOrHealEventArg,

  onEnter: EnterEventArg,
  onDispose: EntityEventArg,

  modifyZeroHealth: ZeroHealthEventArg,
  onRevive: CharacterEventArg,
} satisfies Record<string, new (...args: any[]) => EventArg>;

export type EventMap = typeof EVENT_MAP;
export type EventNames = keyof EventMap;

export type InlineEventNames =
  | "modifyDamage0"
  | "modifyDamage1"
  | "modifyDamage2"
  | "modifyDamage3"
  | "modifyHeal";

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
    public readonly requestingSkillId: number,
  ) {
    super(requestBy);
  }
}

class TriggerEndPhaseSkillRequestArg extends RequestArg {
  constructor(
    requestBy: SkillInfo,
    public readonly who: 0 | 1,
    public readonly requestedEntity: EntityState,
  ) {
    super(requestBy);
  }
}

const REQUEST_MAP = {
  requestSwitchHands: SwitchHandsRequestArg,
  requestReroll: RerollRequestArg,
  requestUseSkill: UseSkillRequestArg,
  requestTriggerEndPhaseSkill: TriggerEndPhaseSkillRequestArg,
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

export type SkillActionFilter<Arg> = (
  state: GameState,
  skillInfo: SkillInfo,
  arg: Arg,
) => boolean;

export interface TriggeredSkillDefinition<E extends EventNames = EventNames>
  extends SkillDefinitionBase<EventArgOf<E>> {
  readonly skillType: null;
  readonly triggerOn: E;
  readonly requiredCost: readonly [];
  readonly gainEnergy: false;
  readonly usagePerRoundVariableName: UsagePerRoundVariableNames | null;
}

export type SkillDefinition =
  | InitiativeSkillDefinition
  | PlayCardSkillDefinition
  | TriggeredSkillDefinition;

export function stringifyDamageInfo(damage: DamageInfo | HealInfo): string {
  if (damage.type === DamageType.Heal) {
    let result = `${stringifyState(damage.source)} heal ${
      damage.value
    } to ${stringifyState(damage.target)}, via skill [skill:${
      damage.via.definition.id
    }]`;
    result += ` (${damage.healKind})`;
    return result;
  } else {
    let result = `${stringifyState(damage.source)} deal ${
      damage.value
    } [damage:${damage.type}] to ${stringifyState(
      damage.target,
    )}, via skill [skill:${damage.via.definition.id}]`;
    return result;
  }
}
