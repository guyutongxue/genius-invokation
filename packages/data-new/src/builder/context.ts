import { DamageType, DiceType } from "@gi-tcg/typings";

import { EntityArea, EntityDefinition, EntityType } from "../base/entity";
import { Mutation, applyMutation } from "../base/mutation";
import { InSkillEventPayload } from "../base/skill";
import { CharacterState, EntityState, GameState } from "../base/state";
import { getEntityArea, getEntityById } from "../util";
import { QueryBuilder, StrictlyTypedQueryBuilder, TargetQueryArg } from "./query";
import {
  AppliableDamageType,
  CombatStatusHandle,
  ExEntityType,
  HandleT,
  SkillHandle,
  SummonHandle,
} from "./type";
import { getEntityDefinition } from "../registry";

/**
 * 用于描述技能的上下文对象。
 * 它们出现在 `.do()` 形式内，将其作为参数传入。
 */
export class SkillContext<
  Readonly extends boolean,
  Ext extends object,
  CallerType extends ExEntityType,
> {
  private readonly eventPayloads: InSkillEventPayload[] = [];
  public readonly callerArea: EntityArea;

  /**
   *
   * @param _state 触发此技能之前的游戏状态
   * @param skillId 技能编号（保证和传入 `registerSkill` 的编号一致）
   * @param callerId 调用者 ID。主动技能的调用者是角色 ID，卡牌技能的调用者是当前玩家的前台角色 ID。
   */
  constructor(
    private _state: GameState,
    private readonly skillId: number,
    public readonly callerId: number,
  ) {
    this.callerArea = getEntityArea(_state, callerId);
  }
  get state() {
    return this._state;
  }
  get player() {
    return this._state.players[this.callerArea.who];
  }
  private get callerState(): CharacterState | EntityState {
    return getEntityById(this._state, this.callerId, true);
  }
  isMyTurn() {
    return this._state.currentTurn === this.callerArea.who;
  }

  query<TypeT extends ExEntityType>(type: TypeT): StrictlyTypedQueryBuilder<Readonly, Ext, CallerType, TypeT> {
    return new QueryBuilder(this as SkillContext<Readonly, Ext, CallerType>).type(type);
  }

  private doTargetQuery(
    arg: TargetQueryArg<boolean, Ext, CallerType>,
  ): StrictlyTypedCharacterContext<boolean>[] {
    let fnResult;
    if (typeof arg === "function") {
      const query = new QueryBuilder<Readonly, Ext, CallerType, ExEntityType>(
        this,
      );
      fnResult = arg(query);
    } else {
      fnResult = arg;
    }
    let result: StrictlyTypedCharacterContext<boolean>[];
    if (fnResult instanceof QueryBuilder) {
      result = fnResult.many() as StrictlyTypedCharacterContext<boolean>[];
    } else if (Array.isArray(fnResult)) {
      result = fnResult;
    } else {
      result = [fnResult as StrictlyTypedCharacterContext<boolean>];
    }
    return result;
  }

  // MUTATIONS

  get events() {
    return this.eventPayloads;
  }

  mutate(...mutations: Mutation[]) {
    for (const m of mutations) {
      this._state = applyMutation(this._state, m);
    }
  }

  emitEvent(...payloads: InSkillEventPayload) {
    this.eventPayloads.push(payloads);
  }

  switchActive(target: TargetQueryArg<false, Ext, CallerType>) {
    const targets = this.doTargetQuery(target);
    if (targets.length !== 1) {
      throw new Error("Expected exactly one target");
    }
    const { who, id: targetId } = targets[0];
    const from = new QueryBuilder(this).character().active().one();
    this.emitEvent("onSwitchActive", {
      type: "switchActive",
      who,
      from: from.state,
      via: this.skillId,
      to: targets[0].state,
    });
    this.mutate({
      type: "switchActive",
      who,
      targetId,
    });
  }

  gainEnergy(value: number, target: TargetQueryArg<false, Ext, CallerType>) {
    const targets = this.doTargetQuery(target);
    for (const t of targets) {
      const targetState = t.state;
      const finalValue = Math.min(
        value,
        targetState.definition.constants.maxEnergy -
          targetState.variables.energy,
      );
      this.mutate({
        type: "modifyEntityVar",
        id: t.id,
        varName: "energy",
        value: targetState.variables.energy + finalValue,
      });
    }
  }

  heal(value: number, target: TargetQueryArg<false, Ext, CallerType>) {
    const targets = this.doTargetQuery(target);
    for (const t of targets) {
      const targetState = t.state;
      const targetInjury =
        targetState.definition.constants.maxHealth -
        targetState.variables.health;
      const finalValue = Math.min(value, targetInjury);
      this.emitEvent("onHeal", {
        expectedValue: value,
        finalValue,
        source: this.callerState,
        via: this.skillId,
        target: targetState,
      });
      this.mutate({
        type: "modifyEntityVar",
        id: t.id,
        varName: "health",
        value: targetState.variables.health + finalValue,
      });
    }
  }

  damage(
    value: number,
    type: DamageType,
    target: TargetQueryArg<false, Ext, CallerType> = ($) => $.opp().active(),
  ) {
    const targets = this.doTargetQuery(target);
    for (const t of targets) {
      const targetState = t.state;
      // TODO: sync events, elemental reaction, etc.
      const finalHealth = Math.max(0, targetState.variables.health - value);
      this.emitEvent("onDamage", {
        value,
        type,
        source: this.callerState,
        via: this.skillId,
        target: targetState,
      });
      this.mutate({
        type: "modifyEntityVar",
        id: t.id,
        varName: "health",
        value: finalHealth,
      });
    }
  }

  apply(type: AppliableDamageType, target: TargetQueryArg<false, Ext, CallerType>) {
    // TODO
  }

  createEntity<TypeT extends EntityType>(
    type: TypeT,
    id: HandleT<TypeT>,
    area?: EntityArea,
  ) {
    const id2 = id as number;
    const def = getEntityDefinition(id2);
    const initState: EntityState = {
      id: Date.now() * 1000 + Math.random() * 1000, // TODO: Errrr, how?
      definition: def,
      variables: def.constants,
    };
    if (typeof area === "undefined") {
      switch (type) {
        case "combatStatus":
          area = {
            type: "combatStatuses",
            who: this.callerArea.who,
          };
          break;
        case "summon":
          area = {
            type: "summons",
            who: this.callerArea.who,
          };
          break;
        case "support":
          area = {
            type: "supports",
            who: this.callerArea.who,
          };
          break;
        default:
          throw new Error(
            `Creating entity of type ${type} requires explicit area`,
          );
      }
    }
    this.emitEvent("onEnter", initState);
    this.mutate({
      type: "createEntity",
      where: area,
      value: initState,
    });
  }
  summon(id: SummonHandle) {
    this.createEntity("summon", id);
  }
  combatStatus(id: CombatStatusHandle) {
    this.createEntity("combatStatus", id);
  }

  disposeEntity(id: number) {
    const state = getEntityById(this._state, id);
    this.emitEvent("onDispose", state);
    this.mutate({
      type: "disposeEntity",
      id,
    });
  }

  absorbDice(strategy: "seq" | "diff", count: number) {
    // TODO return DiceType[]
  }
  generateDice(type: DiceType | "randomElement", count: number) {
    // TODO
  }

  async switchCards(): Promise<void> {
    // TODO
  }
  async reroll(times: number): Promise<void> {
    // TODO
  }
  async useSkill(skill: SkillHandle | "normal"): Promise<void> {
    // TODO
  }

  random<T>(...items: T[]): T {
    // TODO (use global random generator)
    return items[Math.floor(Math.random() * items.length)];
  }
}

type InternalProp = "callerId" | "callerArea";

type SkillContextMutativeProps =
  | "mutate"
  | "events"
  | "emitEvent"
  | "switchActive"
  | "gainEnergy"
  | "heal"
  | "damage"
  | "apply"
  | "createEntity"
  | "summon"
  | "combatStatus"
  | "disposeEntity"
  | "absorbDice"
  | "generateDice"
  | "switchCards"
  | "reroll"
  | "useSkill";

/**
 * 所谓 `StrictlyTyped` 是指，若 `Readonly` 则忽略那些可以改变游戏状态的方法。
 *
 * `StrictlyTypedCharacterContext` 等同理。
 */
export type StrictlyTypedSkillContext<
  Readonly extends boolean,
  Ext extends object,
  CallerType extends ExEntityType,
> = Omit<
  Readonly extends true
    ? Omit<SkillContext<Readonly, Ext, CallerType>, SkillContextMutativeProps>
    : SkillContext<Readonly, Ext, CallerType>,
  InternalProp
>;

export type ExtendedSkillContext<
  Readonly extends boolean,
  Ext extends object,
  CallerType extends ExEntityType,
> = StrictlyTypedSkillContext<Readonly, Ext, CallerType> & Ext;

export type CharacterPosition = "active" | "next" | "prev" | "standby";

export class CharacterContext<Readonly extends boolean> {
  private readonly area: EntityArea;
  constructor(
    private readonly skillContext: SkillContext<Readonly, any, any>,
    private readonly _id: number,
  ) {
    /**
     * 所谓 `StrictlyTyped` 是指
     */
    this.area = getEntityArea(skillContext.state, _id);
  }

  get state(): CharacterState {
    const entity = getEntityById(this.skillContext.state, this._id, true);
    if (entity.definition.type !== "character") {
      throw new Error("Expected character");
    }
    return entity as CharacterState;
  }
  get who() {
    return this.area.who;
  }
  get id() {
    return this._id;
  }

  positionIndex() {
    const state = this.skillContext.state;
    const player = state.players[this.who];
    const thisIdx = player.characters.findIndex((ch) => ch.id === this._id);
    if (thisIdx === -1) {
      throw new Error("Invalid character index");
    }
    return thisIdx;
  }
  satisfyPosition(pos: CharacterPosition) {
    const state = this.skillContext.state;
    const player = state.players[this.who];
    const activeIdx = player.characters.findIndex(
      (ch) => ch.id === player.activeCharacterId,
    );
    const thisIdx = this.positionIndex();
    if (activeIdx === -1) {
      throw new Error("Invalid active character index");
    }
    const length = player.characters.length;
    switch (pos) {
      case "active":
        return player.activeCharacterId === this._id;
      case "standby":
        return player.activeCharacterId !== this._id;
      case "next":
        return (thisIdx - activeIdx + length) % length === 1;
      case "prev":
        return (activeIdx - thisIdx + length) % length === 1;
      default: {
        const _: never = pos;
        throw new Error(`Invalid position ${pos}`);
      }
    }
  }
  isActive() {
    return this.satisfyPosition("active");
  }

  fullEnergy() {
    return (
      this.state.variables.energy === this.state.definition.constants.maxEnergy
    );
  }

  query() {
    return this.skillContext.query("character").byId(this._id).into();
  }

  // MUTATIONS

  gainEnergy(value = 1) {
    this.skillContext.gainEnergy(value, this as CharacterContext<boolean>);
  }
  heal(value: number) {
    this.skillContext.heal(value, this as CharacterContext<boolean>);
  }
  damage(value: number, type: DamageType) {
    this.skillContext.damage(value, type, this as CharacterContext<boolean>);
  }
  apply(type: AppliableDamageType) {
    this.skillContext.apply(type, this as CharacterContext<boolean>);
  }
}

type CharacterContextMutativeProps = "gainEnergy" | "heal" | "damage" | "apply";

export type StrictlyTypedCharacterContext<Readonly extends boolean> =
  Readonly extends true
    ? Omit<CharacterContext<Readonly>, CharacterContextMutativeProps>
    : CharacterContext<Readonly>;

export class EntityContext<
  Readonly extends boolean,
  TypeT extends EntityType = EntityType,
> {
  private readonly area: EntityArea;
  constructor(
    private readonly skillContext: SkillContext<Readonly, any, any>,
    private readonly id: number,
  ) {
    this.area = getEntityArea(skillContext.state, id);
  }

  get state(): EntityState {
    return getEntityById(this.skillContext.state, this.id);
  }
  get who() {
    return this.area.who;
  }

  master() {
    if (this.area.type !== "characters") {
      throw new Error("master() expect a character area");
    }
    return new CharacterContext<Readonly>(
      this.skillContext,
      this.area.characterId,
    );
  }

  dispose() {
    this.skillContext.disposeEntity(this.id);
  }
}
