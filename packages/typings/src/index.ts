import type { JSONSchema, FromSchema } from "json-schema-to-ts";
import { ACTION_SCHEMA } from "./actions.js";

const SUCCESS_SCHEMA = {
  success: { type: "boolean" },
} as const;

export const API = {
  initialize: {
    params: {
      first: { type: "boolean" },
    },
    result: SUCCESS_SCHEMA,
  },
  updateState: {
    params: {
      state: {},
    },
    result: SUCCESS_SCHEMA,
  },
  switchHands: {
    params: {
      hands: { type: "array", items: { type: "number" } },
      canRemove: { type: "boolean" },
    },
    result: {
      removedHands: { type: "array", items: { type: "number" } },
    },
  },
  switchActive: {
    params: {},
    result: {
      active: { type: "number", minimum: 0, maximum: 2 },
    },
  },
  roll: {
    params: {
      dice: { type: "array", items: { type: "number" } },
      canRemove: { type: "boolean" },
    },
    result: {
      removedDice: { type: "array", items: { type: "number" } },
    },
  },
  action: {
    params: {},
    result: {
      action: ACTION_SCHEMA,
    },
  },
  drawHands: {
    params: {},
    result: {
      hands: { type: "array", items: { type: "number" } },
    },
  },
  gameEnd: {
    params: {
      win: { type: "boolean" },
    },
    result: SUCCESS_SCHEMA,
  },
} as const satisfies ApiEntries;

export type ApiEntries = Record<
  string,
  {
    params: Record<string, JSONSchema>;
    result: Record<string, JSONSchema>;
  }
>;

type ApiType = typeof API;

export type RequestType<K extends keyof ApiType> = {
  jsonrpc: "2.0";
  method: K;
  params: {
    [P in keyof ApiType[K]["params"]]: FromSchema<ApiType[K]["params"][P]>;
  };
} & (ApiType[K] extends { result: unknown }
  ? { id: string | number }
  : unknown);

export type AllRequestTypes = {
  [K in keyof ApiType]: RequestType<K>;
}[keyof ApiType];

export type ResponseType<K extends keyof ApiType> = {
  jsonrpc: "2.0";
  result: {} extends ApiType[K]["result"]
    ? never
    : {
        [P in keyof ApiType[K]["result"]]: FromSchema<ApiType[K]["result"][P]>;
      };
  id: string | number;
};

export type AllResponseTypes = {
  [K in keyof ApiType]: ResponseType<K>;
}[keyof ApiType];

export function getRequestSchema(method: string): JSONSchema | undefined {
  return (API as ApiEntries)[method]?.params;
}

export function getResponseSchema(method: string): JSONSchema | undefined {
  return (API as ApiEntries)[method]?.result;
}

export type * from "./actions.js";
export type * from "./character.js";
export type * from "./states.js";
export * from "./elements.js";
