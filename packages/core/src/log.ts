import { GameState } from "./base/state";
import { Event } from "@gi-tcg/typings";
import { ReadonlyDataStore } from "./builder";

export interface GameStateLogEntry {
  readonly state: GameState;
  readonly canResume: boolean;
  readonly events: readonly Event[];
}

interface StoreEntry {
  key: any;
  value: any;
}

function serializeImpl(store: StoreEntry[], v: unknown): any {
  if (
    typeof v === "number" ||
    typeof v === "string" ||
    typeof v === "boolean" ||
    v === null
  ) {
    return v;
  }
  const index = store.findIndex((entry) => entry.key === v);
  if (index !== -1) {
    return { $: index };
  }
  if (Array.isArray(v)) {
    const result = v.map((obj) => serializeImpl(store, obj));
    if (result.length >= 2) {
      store.push({ key: v, value: result });
      return { $: store.length - 1 };
    } else {
      return result;
    }
  }
  if (typeof v === "object") {
    if ("__definition" in v && "id" in v) {
      const result = {
        $$: v.__definition,
        id: v.id,
      };
      store.push({ key: v, value: result });
      return { $: store.length - 1 };
    }
    const result: any = {};
    for (const key in v) {
      result[key] = serializeImpl(store, (v as Record<any, any>)[key]);
    }
    store.push({ key: v, value: result });
    return { $: store.length - 1 };
  } else {
    return v;
  }
}

type MakePropPartial<T, K extends PropertyKey> = Omit<T, K> & {
  [K2 in K]?: unknown;
};

interface SerializedLogEntry {
  s: unknown;
  e: readonly Event[];
  r: boolean;
}

interface SerializedLog {
  store: any[];
  log: SerializedLogEntry[];
};

export function serializeGameStateLog(
  log: readonly GameStateLogEntry[],
): SerializedLog {
  console.log(log[0].state.players[0].initialPiles === log[1].state.players[0].initialPiles);
  const logResult: SerializedLogEntry[] = [];
  const store: StoreEntry[] = [];
  for (const entry of log) {
    const omittedState: MakePropPartial<GameState, "data" | "mutationLog"> = {
      ...entry.state,
    };
    delete omittedState.data;
    delete omittedState.mutationLog;
    const stateResult = serializeImpl(store, omittedState);
    logResult.push({
      s: stateResult,
      e: entry.events,
      r: entry.canResume,
    });
  }
  return {
    store: store.map(({ value }) => value),
    log: logResult,
  };
}

function isValidDefKey(defKey: unknown): defKey is keyof ReadonlyDataStore {
  return ["characters", "entities", "skills", "cards"].includes(
    defKey as string,
  );
}

function deserializeImpl(
  data: ReadonlyDataStore,
  store: readonly any[],
  restoredStore: Record<number, any>,
  v: unknown,
): any {
  if (Array.isArray(v)) {
    return v.map((x) => deserializeImpl(data, store, restoredStore, x));
  } else if (typeof v === "object" && v !== null) {
    if ("$" in v && typeof v.$ === "number") {
      if (!(v.$ in restoredStore)) {
        const refTarget = store[v.$];
        const restoredTarget = deserializeImpl(
          data,
          store,
          restoredStore,
          refTarget,
        );
        restoredStore[v.$] = restoredTarget;
      }
      return restoredStore[v.$];
    }
    if ("$$" in v && "id" in v && isValidDefKey(v.$$)) {
      return data[v.$$].get(v.id as number);
    }
    const result: any = {};
    for (const key in v) {
      result[key] = deserializeImpl(
        data,
        store,
        restoredStore,
        (v as Record<any, any>)[key],
      );
    }
    return result;
  } else {
    return v;
  }
}

export function deserializeGameStateLog(
  data: ReadonlyDataStore,
  { store, log }: SerializedLog,
): GameStateLogEntry[] {
  const restoredStore: Record<number, any> = {};
  const result: GameStateLogEntry[] = [];
  for (const entry of log) {
    const restoredState = deserializeImpl(data, store, restoredStore, entry.s);
    result.push({
      state: {
        data,
        mutationLog: [],
        ...restoredState,
      },
      events: entry.e,
      canResume: entry.r,
    })
  }
  return result;
}
