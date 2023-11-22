import { DamageType } from "@gi-tcg/typings";
import { CharacterDefinition } from "../character";
import { EntityArea, EntityDefinition, EntityType } from "../entity";
import { Mutation, applyMutation } from "../mutation";
import { InSkillEventPayload } from "../skill";
import { CharacterState, EntityState, GameState } from "../state";
import { getEntityArea, getEntityById } from "../util";
import { QueryBuilder, TargetQueryFn } from "./query";
import { ExEntityType, HandleT, SummonHandle } from "./type";
import { getEntityDefinition } from "../registry";

export class SkillContext<Variables = {}> {
  private eventPayloads: InSkillEventPayload[] = [];
  private callerDef: EntityDefinition | CharacterDefinition;
  private callerArea: EntityArea;

  constructor(
    private _state: GameState,
    private skillId: number,
    private callerId: number,
  ) {
    this.callerDef = this.callerState.definition;
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

  query<TypeT extends ExEntityType>(type: TypeT) {
    return new QueryBuilder(this, this.callerArea.who).type(type);
  }

  private doTargetQuery(fn: TargetQueryFn) {
    const query = new QueryBuilder(this, this.callerArea.who).type("character");
    const fnResult = fn(query);
    let result: CharacterContext[];
    if (fnResult instanceof QueryBuilder) {
      result = fnResult.many() as CharacterContext[];
    } else if (Array.isArray(fnResult)) {
      result = fnResult;
    } else {
      result = [fnResult as CharacterContext];
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

  switchActive(target: TargetQueryFn) {
    const targets = this.doTargetQuery(target);
    if (targets.length !== 1) {
      throw new Error("Expected exactly one target");
    }
    const { who, id: targetId } = targets[0];
    const from = new QueryBuilder(this, who).character().active().one();
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

  gainEnergy(value: number, target: TargetQueryFn) {
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

  heal(value: number, target: TargetQueryFn) {
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
    target: TargetQueryFn = ($) => $.opp().active(),
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

  apply(
    type: AppliableDamageType,
    target: TargetQueryFn = ($) => $.opp().active(),
  ) {
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
      id: id2,
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

  disposeEntity(id: number) {
    const state = getEntityById(this._state, id);
    this.emitEvent("onDispose", state);
    this.mutate({
      type: "disposeEntity",
      id,
    });
  }
}

type AppliableDamageType =
  | DamageType.Cryo
  | DamageType.Hydro
  | DamageType.Pyro
  | DamageType.Electro
  | DamageType.Dendro;

export type CharacterPosition = "active" | "next" | "prev" | "standby";

export class CharacterContext {
  private readonly area: EntityArea;
  private readonly SELF_QUERY: TargetQueryFn = ($) => $.byId(this._id);
  constructor(
    private readonly skillContext: SkillContext,
    private readonly _id: number,
  ) {
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

  gainEnergy(value = 1) {
    this.skillContext.gainEnergy(value, this.SELF_QUERY);
  }
  heal(value: number) {
    this.skillContext.heal(value, this.SELF_QUERY);
  }
  damage(value: number, type: DamageType) {
    this.skillContext.damage(value, type, this.SELF_QUERY);
  }
  apply(type: AppliableDamageType) {
    this.skillContext.apply(type, this.SELF_QUERY);
  }
}

export class EntityContext<TypeT extends EntityType = EntityType> {
  private readonly area: EntityArea;
  constructor(
    private readonly skillContext: SkillContext,
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
    return new CharacterContext(this.skillContext, this.area.characterId);
  }

  dispose(): never {
    this.skillContext.disposeEntity(this.id);
    return void 0 as never;
  }
}
