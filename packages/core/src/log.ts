// Copyright (C) 2024 Guyutongxue
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { ExposedMutation } from "@gi-tcg/typings";
import { GameState } from "./base/state";
import { ReadonlyDataStore } from "./builder";

export interface GameStateLogEntry {
  readonly state: GameState;
  readonly canResume: boolean;
  readonly mutations: readonly ExposedMutation[];
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
  e: readonly ExposedMutation[];
  r: boolean;
}

interface SerializedLog {
  store: any[];
  log: SerializedLogEntry[];
}

export function serializeGameStateLog(
  log: readonly GameStateLogEntry[],
): SerializedLog {
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
      e: entry.mutations,
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
      mutations: entry.e,
      canResume: entry.r,
    });
  }
  return result;
}

export enum DetailLogType {
  Phase = "phase",
  Skill = "skill",
  Event = "event",
  Primitive = "primitive",
  Mutation = "mutation",
  Other = "other",
}

export interface DetailLogEntry {
  type: DetailLogType;
  value: string;
  children?: DetailLogEntry[];
}

export interface IDetailLogger {
  log(type: DetailLogType, value: string): void;
  /**
   * Enter next level of log until the return value is disposed
   * @returns A `Disposable` object that will return to the previous level of log when disposed
   */
  subLog(type: DetailLogType, value: string): Disposable;
}

export class DetailLogger implements IDetailLogger {
  private logs: DetailLogEntry[] = [];
  _currentLogs: DetailLogEntry[] = this.logs;
  _parentLogs: DetailLogEntry[][] = [];

  public log(type: DetailLogType, value: string): void {
    this._currentLogs.push({ type, value });
  }

  public subLog(type: DetailLogType, value: string): DetailSubLogger {
    const entry = { type, value, children: [] };
    this._currentLogs.push(entry);
    this._parentLogs.push(this._currentLogs);
    this._currentLogs = entry.children;
    const subLogger = new DetailSubLogger(this);
    return subLogger;
  }

  public getLogs(): DetailLogEntry[] {
    return this.logs;
  }
  public clearLogs(): void {
    this.logs = [];
    this._currentLogs = this.logs;
    this._parentLogs = [];
  }
}

class DetailSubLogger implements IDetailLogger, Disposable {
  constructor(private readonly parent: DetailLogger) {}

  public log(type: DetailLogType, value: string): void {
    this.parent.log(type, value);
  }
  public subLog(type: DetailLogType, value: string): DetailSubLogger {
    return this.parent.subLog(type, value);
  }

  [Symbol.dispose]() {
    this.parent._currentLogs = this.parent._parentLogs.pop()!;
  }
}
