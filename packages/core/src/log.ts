import { CardDefinition } from "./base/card";
import { CharacterDefinition } from "./base/character";
import { EntityDefinition } from "./base/entity";
import { SkillDefinition } from "./base/skill";
import { GameState } from "./base/state";
import { Event } from "@gi-tcg/typings";
import { ReadonlyDataStore } from "./builder";

export interface GameStateLogEntry {
  readonly state: GameState;
  readonly canResume: boolean;
  readonly events: readonly Event[];
}

export type SerializedState<T> = {
  [K in keyof T]: T[K] extends { __definition: infer D, id: number }
    ? { 
      __definition: D,
      id: number
    }
    : SerializedState<T[K]>;
};

export type SerializedGameState = Exclude<SerializedState<GameState>, "data">;

function serializeImpl<T>(v: T): SerializedState<T>;
function serializeImpl(v: unknown): any {
  if (Array.isArray(v)) {
    return v.map(serializeImpl);
  } else if (typeof v === "object" && v !== null) {
    if ("__definition" in v && "id" in v) {
      return {
        __definition: v.__definition,
        id: v.id,
      };
    }
    const result: any = {};
    for (const key in v) {
      result[key] = serializeImpl((v as Record<any, any>)[key]);
    }
    return result;
  } else {
    return v;
  }
}

export function serializeGameState(state: GameState): SerializedGameState {
  return serializeImpl(state);
}

function isValidDefKey(defKey: unknown): defKey is keyof ReadonlyDataStore {
  return ["character", "entity", "skill", "card"].includes(defKey as string);
}

function deserializeImpl<T>(data: ReadonlyDataStore, v: SerializedState<T>): T;
function deserializeImpl(data: ReadonlyDataStore, v: unknown): any {
  if (Array.isArray(v)) {
    return v.map((x) => deserializeImpl(data, x));
  } else if (typeof v === "object" && v !== null) {
    if ("__definition" in v && "id" in v) {
      const defKey = v.__definition;
      if (isValidDefKey(defKey)) {
        return data[defKey].get(v.id as number);
      }
    }
    const result: any = {};
    for (const key in v) {
      result[key] = deserializeImpl(data, (v as Record<any, any>)[key]);
    }
    return result;
  } else {
    return v;
  }
}

export function deserializeGameState(data: ReadonlyDataStore, state: SerializedGameState): GameState {
  return deserializeImpl(data, state);
}

