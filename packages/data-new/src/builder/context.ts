import { CharacterDefinition } from "../character";
import { EntityArea, EntityDefinition, EntityType } from "../entity";
import { Mutation, applyMutation } from "../mutation";
import { InSkillEventPayload } from "../skill";
import { CharacterState, EntityState, GameState } from "../state";
import { getEntityArea, getEntityById } from "../util";
import { QueryBuilder } from "./query";

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

  query(type: "character" | EntityType) {
    return new QueryBuilder(this, type, this.callerArea.who);
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
  private _who: 0 | 1;
  constructor(
    private skillContext: SkillContext,
    private id: number,
  ) {
    this._who = getEntityArea(skillContext.state, id).who;
  }

  get state(): CharacterState {
    const entity = getEntityById(this.skillContext.state, this.id, true);
    if (entity.definition.type !== "character") {
      throw new Error("Expected character");
    }
    return entity as CharacterState;
  }

  get who() {
    return this._who;
  }

  positionIndex() {
    const state = this.skillContext.state;
    const player = state.players[this._who];
    const thisIdx = player.characters.findIndex((ch) => ch.id === this.id);
    if (thisIdx === -1) {
      throw new Error("Invalid character index");
    }
    return thisIdx;
  }
  satisfyPosition(pos: CharacterPosition) {
    const state = this.skillContext.state;
    const player = state.players[this._who];
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
        return player.activeCharacterId === this.id;
      case "standby":
        return player.activeCharacterId !== this.id;
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
    return this.skillContext.query("character").byId(this.id).into();
  }
}

export class EntityContext<TypeT extends EntityType = EntityType> {
  constructor(
    private skillContext: SkillContext,
    private id: number,
  ) {}

  get state(): EntityState {
    return getEntityById(this.skillContext.state, this.id);
  }

  area(): EntityArea {
    return getEntityArea(this.skillContext.state, this.id);
  }
}
