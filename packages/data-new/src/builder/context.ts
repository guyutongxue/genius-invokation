import { CharacterDefinition } from "../character";
import { EntityArea, EntityDefinition, EntityType } from "../entity";
import { Mutation, applyMutation } from "../mutation";
import { InSkillEventPayload } from "../skill";
import { CharacterState, EntityState, GameState } from "../state";
import { getEntityArea, getEntityById } from "../util";
import { QueryBuilder } from "./query";
import { ExEntityType } from "./type";

export class SkillContext {
  private eventPayloads: InSkillEventPayload[] = [];
  private callerDef: EntityDefinition | CharacterDefinition;
  private callerArea: EntityArea;

  constructor(
    private _state: GameState,
    private caller: number,
  ) {
    this.callerDef = getEntityById(_state, caller, true).definition;
    this.callerArea = getEntityArea(_state, caller);
  }

  get state() {
    return this._state;
  }
  get player() {
    return this._state.players[this.callerArea.who];
  }
  isMyTurn() {
    return this._state.currentTurn === this.callerArea.who;
  }

  query<TypeT extends ExEntityType>(type: TypeT) {
    return new QueryBuilder(this, this.callerArea.who).type(type);
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

  emitEvent(...payloads: InSkillEventPayload[]) {
    this.eventPayloads.push(...payloads);
  }
}

export type CharacterPosition = "active" | "next" | "prev" | "standby";

export class CharacterContext {
  private readonly area: EntityArea;
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
}
