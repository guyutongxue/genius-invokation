import { Aura, DamageType, DiceType } from "@gi-tcg/typings";

import { EntityArea, EntityDefinition, EntityType } from "../base/entity";
import { Mutation, applyMutation } from "../base/mutation";
import {
  DamageInfo,
  DamageModifierImpl,
  DeferredAction,
  SkillInfo,
  useSyncSkill,
} from "../base/skill";
import { CharacterState, EntityState, GameState } from "../base/state";
import {
  allEntitiesAtArea,
  getActiveCharacterIndex,
  getEntityArea,
  getEntityById,
  sortDice,
} from "../util";
import { executeQuery } from "../query";
import {
  AppliableDamageType,
  CharacterHandle,
  CombatStatusHandle,
  EquipmentHandle,
  ExContextType,
  ExEntityType,
  HandleT,
  SkillHandle,
  StatusHandle,
  SummonHandle,
} from "./type";
import { CardTag } from "../base/card";
import { GuessedTypeOfQuery } from "../query/types";
import {
  NontrivialDamageType,
  REACTION_DESCRIPTION,
  REACTION_MAP,
} from "./reaction";

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
  private readonly eventPayloads: DeferredAction[] = [];
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
  ): ExContextType<Readonly, GuessedTypeOfQuery<Q>> | undefined;
  $<T>(arg: T): T;
  $(arg: any): any {
    const result = this.$$(arg);
    if (result.length > 0) {
      return result[0];
    } else {
      return void 0;
    }
  }

  /**
   * 在指定某个角色目标时，可传入的参数类型：
   * - Query string 形如 `my active character`
   * - Lambda 返回具体的对象上下文，如 `c => c.targets[0]`。
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

  // Get context of given entity state
  of(entityState: EntityState): EntityContext<Readonly>;
  of(entityState: CharacterState): CharacterContext<Readonly>;
  of<T extends ExEntityType = ExEntityType>(
    entityId: EntityState | CharacterState | number,
  ): ExContextType<Readonly, T>;
  of(entityState: EntityState | CharacterState | number): any {
    if (typeof entityState === "number") {
      entityState = getEntityById(this._state, entityState, true);
    }
    if (entityState.definition.type === "character") {
      return new CharacterContext<Readonly>(this, entityState.id);
    } else {
      return new EntityContext<Readonly, any>(this, entityState.id);
    }
  }

  caller(): ExContextType<Readonly, CallerType> {
    return this.of(this.callerState as any) as any;
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

  emitEvent(...payloads: DeferredAction) {
    this.eventPayloads.push(payloads);
  }

  switchActive(target: TargetQueryArg<false, Ext, CallerType>) {
    const targets = this.queryCoerceToCharacters(target);
    if (targets.length !== 1) {
      throw new Error("Expected exactly one target");
    }
    const switchToTarget = targets[0] as CharacterContext<false>;
    const from = this.$("active character")!;
    if (from.id === switchToTarget.id) {
      return;
    }
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
        state: targetState,
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
        state: targetState,
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
        this._state = useSyncSkill(
          this._state,
          "onBeforeDamage0",
          (st) => {
            damageModifier.setCaller(st);
            return damageModifier;
          },
          this.skillInfo,
        );
        this._state = useSyncSkill(
          this._state,
          "onBeforeDamage1",
          (st) => {
            damageModifier.setCaller(st);
            return damageModifier;
          },
          this.skillInfo,
        );
        damageInfo = damageModifier.damageInfo;

        if (
          damageInfo.type !== DamageType.Physical &&
          damageInfo.type !== DamageType.Piercing &&
          damageInfo.type !== DamageType.Heal
        ) {
          damageInfo = this.doApply(t, damageInfo.type, damageInfo);
        }

        console.log((damageInfo as any).log);
      }

      const finalHealth = Math.max(
        0,
        targetState.variables.health - damageInfo.value,
      );
      this.emitEvent("onDamage", { ...damageInfo, state: this._state });
      this.mutate({
        type: "modifyEntityVar",
        state: targetState,
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
  ): DamageInfo {
    const aura = target.state.variables.aura;
    const [newAura, reaction] = REACTION_MAP[aura][type];
    this.mutate({
      type: "modifyEntityVar",
      state: target.state,
      varName: "aura",
      value: newAura,
    });
    const damageModifier = new DamageModifierImpl(damage);
    damageModifier.setCaller(this.callerState);
    if (reaction !== null) {
      const reactionDescription = REACTION_DESCRIPTION[reaction];
      const [newState, events] = reactionDescription(
        this._state,
        this.skillInfo,
        damageModifier,
      );
      this.eventPayloads.push(...events);
      this._state = newState;
    }
    return damageModifier.damageInfo;
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
    const existEntity = allEntitiesAtArea(this._state, area).find(
      (e) => e.definition.id === id2,
    );
    if (existEntity) {
      // refresh exist entity's variable
      for (const prop in existEntity.variables) {
        if (prop in def.constants) {
          const valueLimit =
            `${prop}$max` in def.constants
              ? def.constants[`${prop}$max`]
              : def.constants[prop];
          this.mutate({
            type: "modifyEntityVar",
            state: existEntity,
            varName: prop,
            value: Math.min(
              def.constants[prop] + existEntity.variables[prop],
              valueLimit,
            ),
          });
        }
      }
    } else {
      const initState: EntityState = {
        id: 0,
        definition: def,
        variables: Object.fromEntries(
          Object.entries(def.constants).filter(([k]) => !k.includes("$")),
        ) as any,
      };
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

  dispose(entityState?: EntityState) {
    if (typeof entityState === "undefined") {
      if (this.callerState.definition.type === "character") {
        throw new Error(
          `Character caller cannot be disposed. You may forget an argument when calling \`dispose\``,
        );
      }
      entityState = this.callerState as EntityState;
    }
    const stateBeforeDispose = this.state;
    this.mutate({
      type: "disposeEntity",
      oldState: entityState,
    });
    this.emitEvent("onDisposing", {
      entity: entityState,
      state: stateBeforeDispose,
    });
  }

  setVariable(
    prop: string,
    value: number,
    target?: CharacterState | EntityState,
  ) {
    target ??= this.callerState;
    this.mutate({
      type: "modifyEntityVar",
      state: target,
      varName: prop,
      value: value,
    });
  }

  addVariable(
    prop: string,
    value: number,
    target?: CharacterState | EntityState,
  ) {
    target ??= this.callerState;
    const finalValue = value + target.variables[prop];
    this.setVariable(prop, finalValue, target);
  }

  replaceDefinition(
    target: TargetQueryArg<false, Ext, CallerType>,
    newCh: CharacterHandle,
  ) {
    const characters = this.queryCoerceToCharacters(target);
    if (characters.length !== 1) {
      throw new Error(`Replace definition must apply on exact one character`);
    }
    const def = this.state.data.character.get(newCh);
    if (typeof def === "undefined") {
      throw new Error(`Unknown character ${newCh}`);
    }
    this.mutate({
      type: "replaceCharacterDefinition",
      state: characters[0].state,
      newDefinition: def,
    });
  }

  absorbDice(strategy: "seq" | "diff", count: number) {
    // TODO return DiceType[]
  }
  generateDice(type: DiceType | "randomElement", count: number) {
    let insertedDice: DiceType[] = [];
    if (type === "randomElement") {
      for (let i = 0; i < count; i++) {
        insertedDice.push(
          this.random(
            DiceType.Anemo,
            DiceType.Cryo,
            DiceType.Dendro,
            DiceType.Electro,
            DiceType.Geo,
            DiceType.Hydro,
            DiceType.Pyro,
          ),
        );
      }
    } else {
      insertedDice = new Array<DiceType>(count).fill(type);
    }
    const newDice = sortDice(this.player, [
      ...this.player.dice,
      ...insertedDice,
    ]);
    this.mutate({
      type: "resetDice",
      who: this.callerArea.who,
      value: newDice,
    });
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
    this.emitEvent("requestSwitchCards", {
      who: this.callerArea.who,
      via: this.skillInfo,
    });
  }
  reroll(times: number) {
    this.emitEvent("requestReroll", {
      who: this.callerArea.who,
      via: this.skillInfo,
      times,
    });
  }
  useSkill(skill: SkillHandle | "normal") {
    let skillId;
    if (skill === "normal") {
      const normalSkills = this.$(
        "active character",
      )!.state.definition.initiativeSkills.filter(
        (sk) => sk.skillType === "normal",
      );
      if (normalSkills.length !== 1) {
        throw new Error("Expected exactly one normal skill");
      }
      skillId = normalSkills[0].id;
    } else {
      skillId = skill;
    }
    this.emitEvent("requestUseSkill", {
      via: this.skillInfo,
      requestingSkillId: skillId,
    });
  }

  random<T>(...items: T[]): T {
    const mutation: Mutation = {
      type: "stepRandom",
      value: -1,
    };
    this.mutate(mutation);
    return items[mutation.value % items.length];
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
  | "characterStatus"
  | "disposeEntity"
  | "setVariable"
  | "addVariable"
  | "absorbDice"
  | "generateDice"
  | "drawCards"
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
    private readonly skillContext: SkillContext<Readonly, {}, any>,
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
  hasArtifact() {
    return this.state.entities.find(
      (v) =>
        v.definition.type === "equipment" &&
        v.definition.tags.includes("artifact"),
    );
  }
  hasWeapon() {
    return this.state.entities.find(
      (v) =>
        v.definition.type === "equipment" &&
        v.definition.tags.includes("weapon"),
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
  equip(equipment: EquipmentHandle) {
    // Remove exist artifact/weapon first
    for (const tag of ["artifact", "weapon"] as const) {
      if (
        this.skillContext.state.data.entity.get(equipment)!.tags.includes(tag)
      ) {
        const exist = this.state.entities.find((v) =>
          v.definition.tags.includes(tag),
        );
        if (exist) {
          this.skillContext.dispose(exist);
        }
      }
    }
    this.skillContext.createEntity("equipment", equipment, this._area);
  }
  removeArtifact(): EntityState {
    const entity = this.state.entities.find((v) =>
      v.definition.tags.includes("artifact"),
    );
    if (!entity) {
      throw new Error(`No artifact to remove`);
    }
    this.skillContext.dispose(entity);
    return entity;
  }
  removeWeapon(): EntityState {
    const entity = this.state.entities.find((v) =>
      v.definition.tags.includes("weapon"),
    );
    if (!entity) {
      throw new Error(`No weapon to remove`);
    }
    this.skillContext.dispose(entity);
    return entity;
  }
  loseEnergy(count = 1): number {
    const originalValue = this.state.variables.energy;
    const finalValue = Math.max(0, originalValue - count);
    this.skillContext.setVariable("energy", finalValue, this.state);
    return originalValue - finalValue;
  }
}

type CharacterContextMutativeProps =
  | "gainEnergy"
  | "heal"
  | "damage"
  | "apply"
  | "addStatus"
  | "equip"
  | "removeArtifact"
  | "removeWeapon";

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

  setVariable(prop: string, value: number) {
    this.skillContext.setVariable(prop, value, this.state);
  }
  addVariable(prop: string, value: number) {
    this.skillContext.addVariable(prop, value, this.state);
  }
  dispose() {
    this.skillContext.dispose(this.state);
  }
}

type EntityContextMutativeProps = "addVariable" | "setVariable" | "dispose";

export type StrictlyTypedEntityContext<
  Readonly extends boolean,
  TypeT extends EntityType = EntityType,
> = Readonly extends true
  ? Omit<EntityContext<Readonly, TypeT>, EntityContextMutativeProps>
  : EntityContext<Readonly, TypeT>;
