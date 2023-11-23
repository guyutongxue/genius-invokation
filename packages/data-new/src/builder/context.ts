import { DamageType } from "@gi-tcg/typings";

import { EntityArea, EntityDefinition, EntityType } from "../entity";
import { Mutation, applyMutation } from "../mutation";
import { InSkillEventPayload } from "../skill";
import { CharacterState, EntityState, GameState } from "../state";
import { getEntityArea, getEntityById } from "../util";
import { QueryBuilder, TargetQueryArg } from "./query";
import {
  AppliableDamageType,
  ExEntityType,
  HandleT,
  SummonHandle,
} from "./type";
import { getEntityDefinition } from "../registry";

export class SkillContext<Readonly extends boolean> {
  private eventPayloads: InSkillEventPayload[] = [];
  private callerArea: EntityArea;

  constructor(
    private _state: GameState,
    private readonly skillId: number,
    private readonly callerId: number,
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

  query<TypeT extends ExEntityType>(type: TypeT) {
    return new QueryBuilder<Readonly, TypeT>(this, this.callerArea.who).type(
      type,
    );
  }

  private doTargetQuery(
    arg: TargetQueryArg<boolean>,
  ): StrictlyTypedCharacterContext<boolean>[] {
    let fnResult;
    if (typeof arg === "function") {
      const query = new QueryBuilder(this, this.callerArea.who).type(
        "character",
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

  switchActive(target: TargetQueryArg<false>) {
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

  gainEnergy(value: number, target: TargetQueryArg<false>) {
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

  heal(value: number, target: TargetQueryArg<false>) {
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
    target: TargetQueryArg<false> = ($) => $.opp().active(),
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

  apply(type: AppliableDamageType, target: TargetQueryArg<false>) {
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

  disposeEntity(id: number) {
    const state = getEntityById(this._state, id);
    this.emitEvent("onDispose", state);
    this.mutate({
      type: "disposeEntity",
      id,
    });
  }
}

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
  | "disposeEntity";

export type StrictlyTypedSkillContext<Readonly extends boolean> =
  Readonly extends true
    ? Omit<SkillContext<Readonly>, SkillContextMutativeProps>
    : SkillContext<Readonly>;

export type CharacterPosition = "active" | "next" | "prev" | "standby";

export class CharacterContext<Readonly extends boolean> {
  private readonly area: EntityArea;
  private readonly SELF_QUERY: TargetQueryArg<false> = ($) => $.byId(this._id);
  constructor(
    private readonly skillContext: SkillContext<Readonly>,
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

  // MUTATIONS

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
    private readonly skillContext: SkillContext<Readonly>,
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

  dispose(): never {
    this.skillContext.disposeEntity(this.id);
    return void 0 as never;
  }
}
