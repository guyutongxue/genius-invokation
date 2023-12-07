import { Aura, DamageType, DiceType } from "@gi-tcg/typings";

import { EntityArea, EntityDefinition, EntityType } from "../base/entity";
import { Mutation, applyMutation } from "../base/mutation";
import {
  DamageInfo,
  DamageModifierImpl,
  DeferredActions,
  SkillInfo,
  useSyncSkill,
} from "../base/skill";
import { CharacterState, EntityState, GameState } from "../base/state";
import { getActiveCharacterIndex, getEntityArea, getEntityById } from "../util";
import { executeQuery } from "./query";
import {
  AppliableDamageType,
  CombatStatusHandle,
  ExContextType,
  ExEntityType,
  HandleT,
  SkillHandle,
  StatusHandle,
  SummonHandle,
} from "./type";
import { getEntityDefinition } from "./registry";
import { CardTag } from "../base/card";
import { GuessedTypeOfQuery } from "@gi-tcg/query-parser";
import { NontrivialDamageType, REACTION_MAP } from "./reaction";

type WrapArray<T> = T extends readonly any[] ? T : T[];

type QueryFn<
  Readonly extends boolean,
  Ext extends object,
  CallerType extends ExEntityType,
  Ret,
> = (ctx: ExtendedSkillContext<Readonly, Ext, CallerType>) => Ret;

type TargetQueryArg<
  Readonly extends boolean,
  Ext extends object,
  CallerType extends ExEntityType,
> =
  | QueryFn<
      Readonly,
      Ext,
      CallerType,
      CharacterContext<Readonly> | CharacterContext<Readonly>[]
    >
  | CharacterContext<Readonly>[]
  | CharacterContext<Readonly>
  | string;

/**
 * 用于描述技能的上下文对象。
 * 它们出现在 `.do()` 形式内，将其作为参数传入。
 */
export class SkillContext<
  Readonly extends boolean,
  Ext extends object,
  CallerType extends ExEntityType,
> {
  private readonly eventPayloads: DeferredActions[] = [];
  public readonly callerArea: EntityArea;

  /**
   *
   * @param _state 触发此技能之前的游戏状态
   * @param skillId 技能编号（保证和传入 `registerSkill` 的编号一致）
   * @param callerId 调用者 ID。主动技能的调用者是角色 ID，卡牌技能的调用者是当前玩家的前台角色 ID。
   */
  constructor(
    private _state: GameState,
    public readonly skillInfo: SkillInfo,
  ) {
    this.callerArea = getEntityArea(_state, skillInfo.caller.id);
  }
  get state() {
    return this._state;
  }
  get player() {
    return this._state.players[this.callerArea.who];
  }
  private get callerState(): CharacterState | EntityState {
    return getEntityById(this._state, this.skillInfo.caller.id, true);
  }
  isMyTurn() {
    return this._state.currentTurn === this.callerArea.who;
  }

  $<Ret>(arg: QueryFn<Readonly, Ext, CallerType, Ret>): Ret;
  $<const Q extends string>(
    arg: Q,
  ): ExContextType<Readonly, GuessedTypeOfQuery<Q>>;
  $<T>(arg: T): T;
  $(arg: any): any {
    const result = this.$$(arg);
    if (result.length > 0) {
      return result[0];
    } else {
      throw new Error(`No entity selected`);
    }
  }

  /**
   * 在指定某个角色目标时，可传入的参数类型：
   * - Query Lambda 形如 `$ => $.active()`
   *   - 该 Lambda 可返回 `QueryBuilder` 如上；
   *   - 也可返回具体的对象上下文，如 `$ => $.opp().one()`。
   * - 直接传入具体的对象上下文。
   */

  $$<Ret>(arg: QueryFn<Readonly, Ext, CallerType, Ret>): WrapArray<Ret>;
  $$<const Q extends string>(
    arg: Q,
  ): ExContextType<Readonly, GuessedTypeOfQuery<Q>>[];
  $$<T>(arg: T): WrapArray<T>;
  $$(arg: any): any {
    if (typeof arg === "function") {
      const fnResult = arg(this);
      if (Array.isArray(fnResult)) {
        return fnResult;
      } else {
        return [fnResult];
      }
    } else if (typeof arg === "string") {
      return executeQuery(this, arg);
    } else if (Array.isArray(arg)) {
      return arg;
    } else {
      return [arg];
    }
  }

  private queryCoerceToCharacters(
    arg: TargetQueryArg<false, Ext, CallerType>,
  ): CharacterContext<Readonly>[] {
    const result = this.$$(arg);
    for (const r of result) {
      if (r instanceof CharacterContext) {
        continue;
      } else {
        throw new Error(`Expected character`);
      }
    }
    return result as CharacterContext<Readonly>[];
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

  emitEvent(...payloads: DeferredActions) {
    this.eventPayloads.push(payloads);
  }

  switchActive(target: TargetQueryArg<false, Ext, CallerType>) {
    const targets = this.queryCoerceToCharacters(target);
    if (targets.length !== 1) {
      throw new Error("Expected exactly one target");
    }
    const switchToTarget = targets[0] as CharacterContext<false>;
    const from = this.$("active character");
    this.mutate({
      type: "switchActive",
      who: switchToTarget.who,
      value: switchToTarget.state,
    });
    this.emitEvent("onSwitchActive", {
      type: "switchActive",
      who: switchToTarget.who,
      from: from.state,
      to: switchToTarget.state,
      state: this.state,
    });
  }

  gainEnergy(value: number, target: TargetQueryArg<false, Ext, CallerType>) {
    const targets = this.queryCoerceToCharacters(target);
    for (const t of targets) {
      const targetState = t.state;
      const finalValue = Math.min(
        value,
        targetState.definition.constants.maxEnergy -
          targetState.variables.energy,
      );
      this.mutate({
        type: "modifyEntityVar",
        oldState: targetState,
        varName: "energy",
        value: targetState.variables.energy + finalValue,
      });
    }
  }

  heal(value: number, target: TargetQueryArg<false, Ext, CallerType>) {
    const targets = this.queryCoerceToCharacters(target);
    for (const t of targets) {
      const targetState = t.state;
      const targetInjury =
        targetState.definition.constants.maxHealth -
        targetState.variables.health;
      const finalValue = Math.min(value, targetInjury);
      this.mutate({
        type: "modifyEntityVar",
        oldState: targetState,
        varName: "health",
        value: targetState.variables.health + finalValue,
      });
      this.emitEvent("onHeal", {
        expectedValue: value,
        finalValue,
        source: this.callerState,
        via: this.skillInfo,
        target: targetState,
        state: this.state,
      });
    }
  }

  damage(
    value: number,
    type: DamageType,
    target: TargetQueryArg<false, Ext, CallerType> = "opp active",
  ) {
    if (type === DamageType.Heal) {
      return this.heal(value, target);
    }
    const targets = this.queryCoerceToCharacters(target);
    for (const t of targets) {
      const targetState = t.state;
      let damageInfo: DamageInfo = {
        source: this.skillInfo.caller,
        target: targetState,
        type,
        value,
        via: this.skillInfo,
      };
      if (type !== DamageType.Piercing) {
        const damageModifier = new DamageModifierImpl(damageInfo);
        useSyncSkill(
          this._state,
          "onBeforeDamage0",
          (st) => {
            damageModifier.setCaller(st);
            return damageModifier;
          },
          this.skillInfo,
        );
        useSyncSkill(
          this._state,
          "onBeforeDamage1",
          (st) => {
            damageModifier.setCaller(st);
            return damageModifier;
          },
          this.skillInfo,
        );
        damageInfo = damageModifier.damageInfo;
        console.log(damageModifier.damageInfo.log);

        if (
          damageInfo.type !== DamageType.Physical &&
          damageInfo.type !== DamageType.Piercing &&
          damageInfo.type !== DamageType.Heal
        ) {
          this.doApply(t, damageInfo.type, damageInfo);
        }
      }

      const finalHealth = Math.max(
        0,
        targetState.variables.health - damageInfo.value,
      );
      this.emitEvent("onDamage", { ...damageInfo, state: this._state });
      this.mutate({
        type: "modifyEntityVar",
        oldState: targetState,
        varName: "health",
        value: finalHealth,
      });
    }
  }

  apply(
    type: AppliableDamageType,
    target: TargetQueryArg<false, Ext, CallerType>,
  ) {
    const characters = this.queryCoerceToCharacters(target);
    for (const ch of characters) {
      this.doApply(ch, type);
    }
  }

  private doApply(
    target: CharacterContext<Readonly>,
    type: NontrivialDamageType,
    damage?: DamageInfo,
  ) {
    const aura = target.state.variables.aura;
    const [newAura, reaction] = REACTION_MAP[aura][type];
    this.mutate({
      type: "modifyEntityVar",
      oldState: target.state,
      varName: "aura",
      value: newAura,
    });
  }

  createEntity<TypeT extends EntityType>(
    type: TypeT,
    id: HandleT<TypeT>,
    area?: EntityArea,
  ) {
    const id2 = id as number;
    const def = this._state.data.entity.get(id2);
    if (typeof def === "undefined") {
      throw new Error(`Unknown entity id ${id2}`);
    }
    const initState: EntityState = {
      id: 0,
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
    this.mutate({
      type: "createEntity",
      where: area,
      value: initState,
    });
    const newState = getEntityById(this._state, initState.id);
    this.emitEvent("onEnter", {
      entity: newState,
      state: this.state,
    });
  }
  summon(id: SummonHandle) {
    this.createEntity("summon", id);
  }
  characterStatus(
    id: StatusHandle,
    target?: TargetQueryArg<false, Ext, CallerType>,
  ) {
    if (target) {
      const targets = this.queryCoerceToCharacters(target);
      for (const t of targets) {
        this.createEntity("status", id, t.area);
      }
    } else {
      this.createEntity("status", id, this.callerArea);
    }
  }
  combatStatus(id: CombatStatusHandle) {
    this.createEntity("combatStatus", id);
  }

  disposeEntity(id: number) {
    const state = getEntityById(this._state, id);
    const stateBeforeDispose = this.state;
    this.mutate({
      type: "disposeEntity",
      oldState: state,
    });
    this.emitEvent("onDisposing", {
      entity: state,
      state: stateBeforeDispose,
    });
  }

  absorbDice(strategy: "seq" | "diff", count: number) {
    // TODO return DiceType[]
  }
  generateDice(type: DiceType | "randomElement", count: number) {
    // TODO
  }

  drawCards(count: number, withTag?: CardTag) {
    const piles = this.player.piles;
    const candidates = withTag
      ? piles.filter((c) => c.definition.tags.includes(withTag))
      : [...piles];
    for (let i = 0; i < count; i++) {
      const value = candidates.pop();
      if (typeof value === "undefined") {
        break;
      }
      this.mutate({
        type: "transferCard",
        path: "pilesToHands",
        who: this.callerArea.who,
        value,
      });
    }
  }
  switchCards() {
    this.emitEvent("requestSwitchCards");
  }
  reroll(times: number) {
    this.emitEvent("requestReroll", times);
  }
  useSkill(skill: SkillHandle | "normal") {
    let skillId;
    if (skill === "normal") {
      const normalSkills = this.$(
        "active character",
      ).state.definition.initiativeSkills.filter(
        (sk) => sk.skillType === "normal",
      );
      if (normalSkills.length !== 1) {
        throw new Error("Expected exactly one normal skill");
      }
      skillId = normalSkills[0].id;
    } else {
      skillId = skill;
    }
    this.emitEvent("requestUseSkill", skillId);
  }

  random<T>(...items: T[]): T {
    const mutation: Mutation = {
      type: "stepRandom",
      value: -1,
    };
    this.mutate(mutation);
    return items[Math.floor(mutation.value * items.length)];
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
  private readonly _area: EntityArea;
  constructor(
    private readonly skillContext: SkillContext<Readonly, any, any>,
    private readonly _id: number,
  ) {
    this._area = getEntityArea(skillContext.state, _id);
  }

  get state(): CharacterState {
    const entity = getEntityById(this.skillContext.state, this._id, true);
    if (entity.definition.type !== "character") {
      throw new Error("Expected character");
    }
    return entity as CharacterState;
  }
  get area() {
    return this._area;
  }
  get who() {
    return this._area.who;
  }
  get id() {
    return this._id;
  }

  get health() {
    return this.state.variables.health;
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
    const activeIdx = getActiveCharacterIndex(player);
    const length = player.characters.length;
    let dx;
    switch (pos) {
      case "active":
        return player.activeCharacterId === this._id;
      case "standby":
        return player.activeCharacterId !== this._id;
      case "next":
        dx = 1;
        break;
      case "prev":
        dx = -1;
        break;
      default: {
        const _: never = pos;
        throw new Error(`Invalid position ${pos}`);
      }
    }
    // find correct next and prev index
    let currentIdx = activeIdx;
    do {
      currentIdx = (currentIdx + dx + length) % length;
    } while (!player.characters[currentIdx].variables.alive);
    return player.characters[currentIdx].id === this._id;
  }
  isActive() {
    return this.satisfyPosition("active");
  }

  fullEnergy() {
    return (
      this.state.variables.energy === this.state.definition.constants.maxEnergy
    );
  }

  $$<const Q extends string>(arg: Q) {
    return this.skillContext.$(`(${arg}) at (character with id ${this._id})`);
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
  addStatus(status: StatusHandle) {
    this.skillContext.createEntity("status", status, this._area);
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
  private readonly _area: EntityArea;
  constructor(
    private readonly skillContext: SkillContext<Readonly, any, any>,
    private readonly id: number,
  ) {
    this._area = getEntityArea(skillContext.state, id);
  }

  get state(): EntityState {
    return getEntityById(this.skillContext.state, this.id);
  }
  get area(): EntityArea {
    return this._area;
  }
  get who() {
    return this._area.who;
  }

  master() {
    if (this._area.type !== "characters") {
      throw new Error("master() expect a character area");
    }
    return new CharacterContext<Readonly>(
      this.skillContext,
      this._area.characterId,
    );
  }

  dispose() {
    this.skillContext.disposeEntity(this.id);
  }
}
