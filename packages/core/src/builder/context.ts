import { Aura, DamageType, DiceType, Reaction } from "@gi-tcg/typings";

import { EntityArea, EntityType, EntityVariables, ExEntityType } from "../base/entity";
import { Mutation, applyMutation } from "../base/mutation";
import {
  DamageInfo,
  EVENT_MAP,
  EventAndRequest,
  EventAndRequestConstructorArgs,
  EventAndRequestNames,
  EventArgOf,
  InlineEventNames,
  ModifyDamage0EventArg,
  SkillDescription,
  SkillInfo,
  constructEventAndRequestArg,
} from "../base/skill";
import {
  AnyState,
  CardState,
  CharacterState,
  EntityState,
  GameState,
} from "../base/state";
import {
  allEntities,
  allEntitiesAtArea,
  drawCard,
  elementOfCharacter,
  getActiveCharacterIndex,
  getEntityArea,
  getEntityById,
  sortDice,
} from "../util";
import { executeQuery } from "../query";
import {
  AppliableDamageType,
  CardHandle,
  CharacterHandle,
  CombatStatusHandle,
  EquipmentHandle,
  HandleT,
  SkillHandle,
  StatusHandle,
  SummonHandle,
  SupportHandle,
  TypedExEntity,
} from "./type";
import { CardTag } from "../base/card";
import { GuessedTypeOfQuery } from "../query/types";
import { NontrivialDamageType, REACTION_MAP } from "../base/reaction";
import { CALLED_FROM_REACTION, OptionalDamageInfo, getReactionDescription } from "./reaction";
import { flip } from "@gi-tcg/utils";
import { GiTcgCoreInternalError, GiTcgDataError } from "../error";

type CharacterTargetArg = CharacterState | CharacterState[] | string;
type EntityTargetArg = EntityState | EntityState[] | string;

interface DrawCardsOpt {
  who?: "my" | "opp";
  withTag?: CardTag | null;
}

export type ContextMetaBase = {
  readonly: boolean;
  eventArgType: unknown;
  callerVars: string;
  callerType: ExEntityType;
};

/**
 * 用于描述技能的上下文对象。
 * 它们出现在 `.do()` 形式内，将其作为参数传入。
 */
export class SkillContext<Meta extends ContextMetaBase> {
  private readonly eventAndRequests: EventAndRequest[] = [];
  public readonly callerArea: EntityArea;

  /**
   * 获取正在执行逻辑的实体的 `CharacterContext` 或 `EntityContext`。
   * @returns
   */
  public readonly self: TypedExEntity<Meta, Meta["callerType"]>;

  /**
   *
   * @param _state 触发此技能之前的游戏状态
   * @param skillInfo
   */
  constructor(
    private _state: GameState,
    public readonly skillInfo: SkillInfo,
    public readonly eventArg: Omit<Meta["eventArgType"], `_${string}`>,
  ) {
    this.callerArea = getEntityArea(_state, skillInfo.caller.id);
    this.self = this.of(this.skillInfo.caller);
  }
  get state() {
    return this._state;
  }
  get player() {
    return this._state.players[this.callerArea.who];
  }
  get oppPlayer() {
    return this._state.players[flip(this.callerArea.who)];
  }
  private get callerState(): CharacterState | EntityState {
    return getEntityById(this._state, this.skillInfo.caller.id, true);
  }
  isMyTurn() {
    return this._state.currentTurn === this.callerArea.who;
  }

  private handleInlineEvent<E extends InlineEventNames>(
    event: E,
    arg: EventArgOf<E>,
  ) {
    const entities = allEntities(this.state, true);
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
        requestBy: null,
        charged: false,
        plunging: false,
      }));
    for (const info of infos) {
      arg._currentSkillInfo = info;
      try {
        getEntityById(this.state, info.caller.id, true);
      } catch {
        continue;
      }
      if (
        "filter" in info.definition &&
        !(0, info.definition.filter)(this.state, info, arg)
      ) {
        continue;
      }
      const desc = info.definition.action as SkillDescription<EventArgOf<E>>;
      let newEvents;
      [this._state, newEvents] = desc(this.state, info, arg);
      this.eventAndRequests.push(...newEvents);
    }
  }

  $<const Q extends string>(
    arg: Q,
  ): TypedExEntity<Meta, GuessedTypeOfQuery<Q>> | undefined {
    const result = this.$$(arg);
    return result[0];
  }

  $$<const Q extends string>(
    arg: Q,
  ): TypedExEntity<Meta, GuessedTypeOfQuery<Q>>[] {
    return executeQuery(this, arg);
  }

  // Get context of given entity state
  of(entityState: EntityState): Entity<Meta>;
  of(entityState: CharacterState): Character<Meta>;
  of<T extends ExEntityType = ExEntityType>(
    entityId: EntityState | CharacterState | number,
  ): TypedExEntity<Meta, T>;
  of(entityState: EntityState | CharacterState | number): unknown {
    if (typeof entityState === "number") {
      entityState = getEntityById(this._state, entityState, true);
    }
    if (entityState.definition.type === "character") {
      return new Character(this, entityState.id);
    } else {
      return new Entity(this, entityState.id);
    }
  }

  private queryOrOf<TypeT extends ExEntityType>(
    q: AnyState | AnyState[] | string,
  ): TypedExEntity<Meta, TypeT>[] {
    if (Array.isArray(q)) {
      return q.map((s) => this.of(s));
    } else if (typeof q === "string") {
      return this.$$(q) as TypedExEntity<Meta, TypeT>[];
    } else {
      return [this.of(q)];
    }
  }

  private queryCoerceToCharacters(
    arg: CharacterTargetArg,
  ): TypedCharacter<Meta>[] {
    const result = this.queryOrOf(arg);
    for (const r of result) {
      if (r instanceof Character) {
        continue;
      } else {
        throw new GiTcgDataError(`Expected character target, but query ${arg} found noncharacter entities`);
      }
    }
    return result as TypedCharacter<Meta>[];
  }
  /** 本回合已经使用了几次此技能 */
  countOfThisSkill(): number {
    return this.countOfSkill(this.skillInfo.caller.id, this.skillInfo.definition.id as SkillHandle);
  }
  countOfSkill(callerId: number, handle: SkillHandle): number {
    return this.state.globalActionLog.filter(
      ({ roundNumber, action }) =>
        roundNumber === this.state.roundNumber &&
        action.type === "useSkill" &&
        action.skill.caller.id === callerId &&
        action.skill.definition.id === handle,
    ).length;
  }

  // MUTATIONS

  get events() {
    return this.eventAndRequests;
  }

  mutate(...mutations: Mutation[]) {
    for (const m of mutations) {
      this._state = applyMutation(this._state, m);
    }
  }

  emitEvent<E extends EventAndRequestNames>(
    event: E,
    ...args: EventAndRequestConstructorArgs<E>
  ) {
    const arg = constructEventAndRequestArg(event, ...args);
    this.eventAndRequests.push([event, arg] as any);
  }

  switchActive(target: CharacterTargetArg) {
    const targets = this.queryCoerceToCharacters(target);
    if (targets.length !== 1) {
      throw new GiTcgDataError("Expected exactly one target when switching active");
    }
    const switchToTarget = targets[0];
    const from = this.$("active character")!;
    if (from.id === switchToTarget.id) {
      return;
    }
    this.mutate({
      type: "switchActive",
      who: switchToTarget.who,
      value: switchToTarget.state,
    });
    this.emitEvent("onSwitchActive", this.state, {
      type: "switchActive",
      who: switchToTarget.who,
      from: from.state,
      to: switchToTarget.state,
    });
  }

  gainEnergy(value: number, target: CharacterTargetArg) {
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

  /** 治疗角色。若角色已倒下，则复苏该角色。*/
  heal(value: number, target: CharacterTargetArg) {
    const targets = this.queryCoerceToCharacters(target);
    for (const t of targets) {
      const targetState = t.state;
      if (targetState.variables.alive === 0) {
        this.mutate({
          type: "modifyEntityVar",
          state: targetState,
          varName: "alive",
          value: 1,
        });
        this.emitEvent("onRevive", this.state, targetState);
      }
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
      this.mutate({
        type: "pushDamageLog",
        damage: {
          type: DamageType.Heal,
          source: this.skillInfo.caller,
          target: targetState,
          value: finalValue,
          via: this.skillInfo,
          fromReaction: this.fromReaction,
        },
      });
      this.emitEvent("onHeal", this.state, {
        expectedValue: value,
        finalValue,
        source: this.callerState,
        via: this.skillInfo,
        target: targetState,
      });
    }
  }

  damage(
    type: DamageType,
    value: number,
    target: CharacterTargetArg = "opp active",
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
        fromReaction: this.fromReaction,
      };
      if (type !== DamageType.Piercing) {
        const damageModifier = new ModifyDamage0EventArg(
          this.state,
          damageInfo,
        );
        this.handleInlineEvent("modifyDamage0", damageModifier);
        this.handleInlineEvent("modifyDamage1", damageModifier);
        damageInfo = damageModifier.damageInfo;

        if (
          damageInfo.type !== DamageType.Physical &&
          damageInfo.type !== DamageType.Piercing &&
          damageInfo.type !== DamageType.Heal
        ) {
          damageInfo = this.doApply(t, damageInfo.type, damageInfo);
        }

        console.log(damageInfo);
      }

      const finalHealth = Math.max(
        0,
        targetState.variables.health - damageInfo.value,
      );
      this.mutate({
        type: "modifyEntityVar",
        state: targetState,
        varName: "health",
        value: finalHealth,
      });
      this.mutate({
        type: "pushDamageLog",
        damage: damageInfo,
      });
      this.emitEvent("onDamage", this.state, damageInfo);
    }
  }

  /**
   * 为某角色附着元素。
   * @param type 附着的元素类型
   * @param target 角色目标
   */
  apply(type: AppliableDamageType, target: CharacterTargetArg) {
    const characters = this.queryCoerceToCharacters(target);
    for (const ch of characters) {
      this.doApply(ch, type);
    }
  }

  private get fromReaction(): Reaction | null {
    return (this as any)[CALLED_FROM_REACTION] ?? null;
  }

  private doApply(
    target: TypedCharacter<Meta>,
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
    const optDamageInfo: OptionalDamageInfo = damage
      ? {
          ...damage,
          isDamage: true,
        }
      : {
          type,
          value: 0,
          source: this.skillInfo.caller,
          via: this.skillInfo,
          target: target.state,
          isDamage: false,
          fromReaction: this.fromReaction,
        };
    const damageModifier = new ModifyDamage0EventArg(this.state, optDamageInfo);
    damageModifier._currentSkillInfo = this.skillInfo;
    if (reaction !== null) {
      this.emitEvent("onReaction", this.state, {
        type: reaction,
        via: this.skillInfo,
        target: target.state,
        damage,
      });
      const reactionDescription = getReactionDescription(reaction);
      const [newState, events] = reactionDescription(
        this._state,
        this.skillInfo,
        damageModifier,
      );
      this.eventAndRequests.push(...events);
      this._state = newState;
    }
    return damageModifier.damageInfo;
  }

  createEntity<TypeT extends EntityType>(
    type: TypeT,
    id: HandleT<TypeT>,
    area?: EntityArea,
  ): Entity<Meta> | null {
    const id2 = id as number;
    const def = this._state.data.entities.get(id2);
    if (typeof def === "undefined") {
      throw new GiTcgDataError(`Unknown entity definition id ${id2}`);
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
          throw new GiTcgDataError(
            `Creating entity of type ${type} requires explicit area`,
          );
      }
    }
    const entitiesAtArea = allEntitiesAtArea(this._state, area);
    // handle immuneControl vs disableSkill;
    // do not generate Frozen etc. on those characters
    const immuneControl = entitiesAtArea.find(
      (e) =>
        e.definition.type === "status" &&
        e.definition.tags.includes("immuneControl"),
    );
    if (
      immuneControl &&
      def.type === "status" &&
      def.tags.includes("disableSkill")
    ) {
      return null;
    }
    const existOverride = entitiesAtArea.find(
      (e): e is EntityState =>
        e.definition.type !== "character" &&
        e.definition.type !== "support" &&
        e.definition.id === id2,
    );
    if (existOverride) {
      // refresh exist entity's variable
      for (const prop in existOverride.variables) {
        const oldValue = existOverride.variables[prop];
        if (typeof def.constants[prop] === "number") {
          let newValue = def.constants[prop];
          if (`${prop}$max` in def.constants) {
            // 若存在 `$max` 设定（如 usage）累加状态值
            const limit = def.constants[`${prop}$max`];
            const additional = def.constants[`${prop}$add`] ?? newValue;
            if (oldValue < limit) {
              // 如果当前值比上限低，进行累加
              newValue = Math.min(
                limit,
                oldValue + additional,
              );
            } else {
              // 如果当前值比上限高，维持原样
              newValue = oldValue;
            }
          }
          this.mutate({
            type: "modifyEntityVar",
            state: existOverride,
            varName: prop,
            value: newValue,
          });
        }
      }
      const newState = getEntityById(this.state, existOverride.id);
      this.emitEvent("onEnter", this.state, {
        newState,
        overrided: existOverride,
      });
      return this.of(newState);
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
      this.emitEvent("onEnter", this.state, {
        newState,
        overrided: null,
      });
      return this.of(newState);
    }
  }
  summon(id: SummonHandle, where: "my" | "opp" = "my") {
    if (where === "my") {
      this.createEntity("summon", id);
    } else {
      this.createEntity("summon", id, {
        type: "summons",
        who: flip(this.callerArea.who),
      });
    }
  }
  characterStatus(id: StatusHandle, target: CharacterTargetArg = "@self") {
    const targets = this.queryCoerceToCharacters(target);
    for (const t of targets) {
      this.createEntity("status", id, t.area);
    }
  }
  combatStatus(id: CombatStatusHandle, where: "my" | "opp" = "my") {
    if (where === "my") {
      this.createEntity("combatStatus", id);
    } else {
      this.createEntity("combatStatus", id, {
        type: "combatStatuses",
        who: flip(this.callerArea.who),
      });
    }
  }
  createSupport(id: SupportHandle, where: "my" | "opp") {
    if (where === "my") {
      this.createEntity("support", id);
    } else {
      this.createEntity("support", id, {
        type: "supports",
        who: flip(this.callerArea.who),
      });
    }
  }

  dispose(target: EntityTargetArg = "@self") {
    const targets = this.queryOrOf(target);
    for (const t of targets) {
      const entityState = t.state;
      if (entityState.definition.type === "character") {
        throw new GiTcgDataError(
          `Character caller cannot be disposed. You may forget an argument when calling \`dispose\``,
        );
      }
      this.emitEvent("onDispose", this.state, entityState);
      this.mutate({
        type: "disposeEntity",
        oldState: entityState,
      });
    }
  }

  // NOTICE: getVariable/setVariable/addVariable 应当将 caller 的严格版声明放在最后一个
  // 因为 (...args: infer R) 只能获取到重载列表中的最后一个，而严格版是 BuilderWithShortcut 需要的

  getVariable(prop: string, target: CharacterState | EntityState): number;
  getVariable(prop: Meta["callerVars"]): number;
  getVariable(prop: string, target?: CharacterState | EntityState) {
    if (target) {
      return this.of(target).getVariable(prop);
    } else {
      return this.self.getVariable(prop);
    }
  }

  setVariable(
    prop: string,
    value: number,
    target: CharacterState | EntityState,
  ): void;
  setVariable(prop: Meta["callerVars"], value: number): void;
  setVariable(prop: any, value: number, target?: CharacterState | EntityState) {
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
    target: CharacterState | EntityState,
  ): void;
  addVariable(prop: Meta["callerVars"], value: number): void;
  addVariable(prop: any, value: number, target?: CharacterState | EntityState) {
    target ??= this.callerState;
    const finalValue = value + target.variables[prop];
    this.setVariable(prop, finalValue, target);
  }

  replaceDefinition(target: CharacterTargetArg, newCh: CharacterHandle) {
    const characters = this.queryCoerceToCharacters(target);
    if (characters.length !== 1) {
      throw new GiTcgDataError(`Replace definition must apply on exact one character`);
    }
    const ch = characters[0];
    const oldDef = ch.state.definition;
    const def = this._state.data.characters.get(newCh);
    if (typeof def === "undefined") {
      throw new GiTcgDataError(`Unknown character definition id ${newCh}`);
    }
    this.mutate({
      type: "replaceCharacterDefinition",
      state: characters[0].state,
      newDefinition: def,
    });
    this.emitEvent(
      "onReplaceCharacterDefinition",
      this.state,
      ch.state,
      oldDef,
      def,
    );
  }

  absorbDice(strategy: "seq" | "diff", count: number): DiceType[] {
    switch (strategy) {
      case "seq": {
        const newDice = this.player.dice.slice(0, count);
        this.mutate({
          type: "resetDice",
          who: this.callerArea.who,
          value: this.player.dice.slice(count),
        });
        return newDice;
      }
      case "diff": {
        const collected: DiceType[] = [];
        const dice = [...this.player.dice];
        for (let i = 0; i < count; i++) {
          let found = false;
          for (let j = 0; j < dice.length; j++) {
            // 万能骰子或者不重复的骰子
            if (dice[j] === DiceType.Omni || !collected.includes(dice[j])) {
              collected.push(dice[j]);
              dice.splice(j, 1);
              found = true;
              break;
            }
          }
          if (!found) {
            break;
          }
        }
        this.mutate({
          type: "resetDice",
          who: this.callerArea.who,
          value: dice,
        });
        return collected;
      }
      default: {
        const _: never = strategy;
        throw new GiTcgDataError(`Invalid strategy ${strategy}`);
      }
    }
  }
  generateDice(type: DiceType | "randomElement", count: number) {
    let insertedDice: DiceType[] = [];
    if (type === "randomElement") {
      const diceTypes = [
        DiceType.Anemo,
        DiceType.Cryo,
        DiceType.Dendro,
        DiceType.Electro,
        DiceType.Geo,
        DiceType.Hydro,
        DiceType.Pyro,
      ];
      for (let i = 0; i < count; i++) {
        const generated = this.random(...diceTypes);
        insertedDice.push(generated);
        diceTypes.splice(diceTypes.indexOf(generated), 1);
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
  }

  createHandCard(cardId: CardHandle) {
    const cardDef = this._state.data.cards.get(cardId);
    if (typeof cardDef === "undefined") {
      throw new GiTcgDataError(`Unknown card definition id ${cardId}`);
    }
    const cardState: CardState = {
      id: 0,
      definition: cardDef,
    };
    const who = this.callerArea.who;
    this.mutate({
      type: "createCard",
      who,
      target: "hands",
      value: cardState,
    });
    if (this.player.hands.length > this._state.config.maxHands) {
      this.mutate({
        type: "disposeCard",
        who,
        oldState: cardState,
        used: false,
      });
    }
  }

  drawCards(count: number, opt?: DrawCardsOpt) {
    const { withTag = null, who: myOrOpt = "my" } = (opt ??= {});
    const who =
      myOrOpt === "my" ? this.callerArea.who : flip(this.callerArea.who);
    for (let i = 0; i < count; i++) {
      this._state = drawCard(this._state, who, withTag);
    }
  }
  switchCards() {
    this.emitEvent("requestSwitchHands", this.skillInfo, this.callerArea.who);
  }
  reroll(times: number) {
    this.emitEvent("requestReroll", this.skillInfo, this.callerArea.who, times);
  }
  useSkill(skill: SkillHandle | "normal") {
    const activeCh = this.$("active character")!.state;
    let skillId;
    if (skill === "normal") {
      const normalSkills = activeCh.definition.initiativeSkills.filter(
        (sk) => sk.skillType === "normal",
      );
      if (normalSkills.length === 0) {
        throw new GiTcgDataError("Expected one normal skill on active character");
      }
      skillId = normalSkills[0].id;
    } else {
      skillId = skill;
    }
    this.emitEvent("requestUseSkill", this.skillInfo, activeCh, skillId);
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

type InternalProp = "callerArea";

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
  | "dispose"
  | "setVariable"
  | "addVariable"
  | "absorbDice"
  | "generateDice"
  | "createHandCard"
  | "drawCards"
  | "switchCards"
  | "reroll"
  | "useSkill";

/**
 * 所谓 `Typed` 是指，若 `Readonly` 则忽略那些可以改变游戏状态的方法。
 *
 * `TypedCharacter` 等同理。
 */
export type TypedSkillContext<Meta extends ContextMetaBase> =
  Meta["readonly"] extends true
    ? Omit<SkillContext<Meta>, SkillContextMutativeProps | InternalProp>
    : Omit<SkillContext<Meta>, InternalProp>;

export type CharacterPosition = "active" | "next" | "prev" | "standby";

/**
 * 提供一些针对角色的便利方法，不需要 SkillContext 参与。
 * 仅当保证 GameState 不发生变化时使用。
 */
export class CharacterBase {
  protected _area: EntityArea;
  constructor(
    private gameState: GameState,
    protected readonly _id: number,
  ) {
    this._area = getEntityArea(gameState, _id);
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
  positionIndex(currentState: GameState = this.gameState) {
    const player = currentState.players[this.who];
    const thisIdx = player.characters.findIndex((ch) => ch.id === this._id);
    if (thisIdx === -1) {
      throw new GiTcgCoreInternalError("Invalid character index");
    }
    return thisIdx;
  }
  satisfyPosition(
    pos: CharacterPosition,
    currentState: GameState = this.gameState,
  ) {
    const player = currentState.players[this.who];
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
        throw new GiTcgDataError(`Invalid position ${pos}`);
      }
    }
    // find correct next and prev index
    let currentIdx = activeIdx;
    do {
      currentIdx = (currentIdx + dx + length) % length;
    } while (!player.characters[currentIdx].variables.alive);
    return player.characters[currentIdx].id === this._id;
  }
}

interface AddStatusOptions {
  variables: Partial<EntityVariables>;
}

export class Character<Meta extends ContextMetaBase> extends CharacterBase {
  constructor(
    private readonly skillContext: SkillContext<Meta>,
    id: number,
  ) {
    super(skillContext.state, id);
  }

  get state(): CharacterState {
    const entity = getEntityById(this.skillContext.state, this._id, true);
    if (entity.definition.type !== "character") {
      throw new GiTcgCoreInternalError("Expected character");
    }
    return entity as CharacterState;
  }

  get health() {
    return this.state.variables.health;
  }
  get energy() {
    return this.state.variables.energy;
  }
  get aura() {
    return this.state.variables.aura;
  }
  positionIndex() {
    return super.positionIndex(this.skillContext.state);
  }
  satisfyPosition(pos: CharacterPosition) {
    return super.satisfyPosition(pos, this.skillContext.state);
  }
  isActive() {
    return this.satisfyPosition("active");
  }
  isMine() {
    return this.area.who === this.skillContext.callerArea.who;
  }
  fullEnergy() {
    const state = this.state;
    return state.variables.energy === state.definition.constants.maxEnergy;
  }
  element(): DiceType {
    return elementOfCharacter(this.state.definition);
  }
  hasArtifact() {
    return this.state.entities.find(
      (v) =>
        v.definition.type === "equipment" &&
        v.definition.tags.includes("artifact"),
    );
  }
  hasWeapon(): EntityState | null {
    return (
      this.state.entities.find(
        (v) =>
          v.definition.type === "equipment" &&
          v.definition.tags.includes("weapon"),
      ) ?? null
    );
  }
  hasEquipment(id: EquipmentHandle): EntityState | null {
    return (
      this.state.entities.find(
        (v) => v.definition.type === "equipment" && v.definition.id === id,
      ) ?? null
    );
  }
  hasStatus(id: StatusHandle): EntityState | null {
    return (
      this.state.entities.find(
        (v) => v.definition.type === "status" && v.definition.id === id,
      ) ?? null
    );
  }

  $$<const Q extends string>(arg: Q) {
    return this.skillContext.$(`(${arg}) at (with id ${this._id})`);
  }

  // MUTATIONS

  gainEnergy(value = 1) {
    this.skillContext.gainEnergy(value, this.state);
  }
  heal(value: number) {
    this.skillContext.heal(value, this.state);
  }
  damage(type: DamageType, value: number) {
    this.skillContext.damage(type, value, this.state);
  }
  apply(type: AppliableDamageType) {
    this.skillContext.apply(type, this.state);
  }
  addStatus(status: StatusHandle, opt?: AddStatusOptions) {
    const st = this.skillContext.createEntity("status", status, this._area);
    if (st === null) {
      return;
    }
    const variables = opt?.variables ?? {};
    for (const prop in variables) {
      const value = variables[prop];
      if (typeof value === "number") {
        this.skillContext.setVariable(prop, value, st.state);
      }
    }
  }
  equip(equipment: EquipmentHandle) {
    // Remove exist artifact/weapon first
    for (const tag of ["artifact", "weapon"] as const) {
      if (
        this.skillContext.state.data.entities.get(equipment)?.tags.includes(tag)
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
  removeArtifact(): EntityState | null {
    const entity = this.state.entities.find((v) =>
      v.definition.tags.includes("artifact"),
    );
    if (!entity) {
      return null;
    }
    this.skillContext.dispose(entity);
    return entity;
  }
  removeWeapon(): EntityState | null {
    const entity = this.state.entities.find((v) =>
      v.definition.tags.includes("weapon"),
    );
    if (!entity) {
      return null;
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
  getVariable(prop: string) {
    if (!(prop in this.state.variables)) {
      throw new GiTcgDataError(`Invalid variable ${prop}`);
    }
    return this.state.variables[prop];
  }

  setVariable(prop: string, value: number) {
    this.skillContext.setVariable(prop, value, this.state);
  }
  addVariable(prop: string, value: number) {
    this.skillContext.addVariable(prop, value, this.state);
  }
  dispose(): never {
    throw new GiTcgDataError(`Cannot dispose character (or passive skill)`);
  }
}

type CharacterMutativeProps =
  | "gainEnergy"
  | "heal"
  | "damage"
  | "apply"
  | "addStatus"
  | "equip"
  | "removeArtifact"
  | "removeWeapon"
  | "setVariable"
  | "addVariable"
  | "dispose";

export type TypedCharacter<Meta extends ContextMetaBase> =
  Meta["readonly"] extends true
    ? Omit<Character<Meta>, CharacterMutativeProps>
    : Character<Meta>;

export class Entity<Meta extends ContextMetaBase> {
  private readonly _area: EntityArea;
  constructor(
    private readonly skillContext: SkillContext<Meta>,
    public readonly id: number,
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
  getVariable(prop: string) {
    if (!(prop in this.state.variables)) {
      throw new GiTcgDataError(`Invalid variable ${prop}`);
    }
    return this.state.variables[prop];
  }

  master() {
    if (this._area.type !== "characters") {
      throw new GiTcgDataError("master() expect a character area");
    }
    return new Character<Meta>(this.skillContext, this._area.characterId);
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

type EntityMutativeProps = "addVariable" | "setVariable" | "dispose";

export type TypedEntity<Meta extends ContextMetaBase> =
  Meta["readonly"] extends true
    ? Omit<Entity<Meta>, EntityMutativeProps>
    : Entity<Meta>;
