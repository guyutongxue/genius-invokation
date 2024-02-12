import { GameState } from "./base/state";
import { Event } from "@gi-tcg/typings";
import { ReadonlyDataStore } from "./builder";

export interface GameStateLogEntry {
  readonly state: GameState;
  readonly canResume: boolean;
  readonly events: readonly Event[];
}

export type SerializedState<T> = T extends ReadonlyArray<infer U>
  ? SerializedState<U>[]
  : T extends object
    ? {
        [K in keyof T]: T[K] extends { __definition: infer D; id: number }
          ? {
              __definition: D;
              id: number;
            }
          : SerializedState<T[K]>;
      }
    : T;

export type SerializedGameState = Omit<
  SerializedState<GameState>,
  "data" | "mutationLog"
>;

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

type MakePropPartial<T, K extends PropertyKey> = Omit<T, K> & {
  [K2 in K]?: unknown;
};

export function serializeGameState(state: GameState): SerializedGameState {
  const result: MakePropPartial<GameState, "data" | "mutationLog"> = {
    ...state,
  };
  delete result.data;
  delete result.mutationLog;
  return serializeImpl(result);
}

function isValidDefKey(defKey: unknown): defKey is keyof ReadonlyDataStore {
  return ["characters", "entities", "skills", "cards"].includes(
    defKey as string,
  );
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

export function deserializeGameState(
  data: ReadonlyDataStore,
  state: SerializedGameState,
): GameState {
  const result = deserializeImpl<Omit<GameState, "data" | "mutationLog">>(
    data,
    state,
  );
  return {
    data,
    mutationLog: [],
    ...result,
  };
}
