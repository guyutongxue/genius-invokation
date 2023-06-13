import type { JSONSchema, FromSchema } from "json-schema-to-ts";
import { ACTION_SCHEMA } from "./actions.js";
import { EVENT_SCHEMA } from "./events.js";

export const API = {
  initialize: {
    params: {
      first: { type: "boolean" },
    },
    result: { success: { const: true } },
  },
  switchHands: {
    params: {
      hands: { type: "array", items: { type: "integer" } },
      canRemove: { type: "boolean" },
    },
    result: {
      removedHands: { type: "array", items: { type: "integer" } },
    },
  },
  switchActive: {
    params: {},
    result: {
      active: { type: "integer", minimum: 0, maximum: 2 },
    },
  },
  roll: {
    params: {
      dice: { type: "array", items: { type: "integer" } },
      canRemove: { type: "boolean" },
    },
    result: {
      removedDice: { type: "array", items: { type: "integer" } },
    },
  },
  action: {
    params: {
      state: {},
      skills: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            cost: { type: "array", items: { type: "integer" } },
          },
        },
        required: ["name", "cost"],
      },
      cards: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "integer" },
            cost: { type: "array", items: { type: "integer" } },
          },
        },
        required: ["id", "cost"],
      },
      switchActive: {
        type: "object",
        additionalProperties: false,
        properties: {
          fast: { type: "boolean" },
          cost: { type: "array", items: { type: "integer" } },
        },
        required: ["fast", "cost"],
      },
    },
    result: {
      action: ACTION_SCHEMA,
    },
  },
  eventArrived: {
    params: {
      event: EVENT_SCHEMA,
    },
    result: {},
  },
  drawHands: {
    params: {
      hands: { type: "array", items: { type: "integer" } },
      destroyed: { type: "array", items: { type: "integer" } },
    },
    result: {},
  },
  gameEnd: {
    params: {
      win: { type: "boolean" },
    },
    result: {},
  },
} as const satisfies ApiEntries;

export type ApiEntries = Record<
  string,
  {
    params: Record<string, JSONSchema>;
    result: Record<string, JSONSchema>;
  }
>;

export type ApiType = typeof API;

export type MethodNames = keyof ApiType;

type ReqOf<K extends MethodNames> = {
  [P in keyof ApiType[K]["params"]]: FromSchema<ApiType[K]["params"][P]>;
};
type RequestTypeCache = {
  initialize: ReqOf<"initialize">;
  switchHands: ReqOf<"switchHands">;
  switchActive: ReqOf<"switchActive">;
  roll: ReqOf<"roll">;
  action: ReqOf<"action">;
  eventArrived: ReqOf<"eventArrived">;
  drawHands: ReqOf<"drawHands">;
  gameEnd: ReqOf<"gameEnd">;
};
export type RequestType<K extends MethodNames> = RequestTypeCache[K];

type ResOf<K extends MethodNames> = {
  [P in keyof ApiType[K]["result"]]: FromSchema<ApiType[K]["result"][P]>;
};
type ResponseTypeCache = {
  initialize: ResOf<"initialize">;
  switchHands: ResOf<"switchHands">;
  switchActive: ResOf<"switchActive">;
  roll: ResOf<"roll">;
  action: ResOf<"action">;
  eventArrived: ResOf<"eventArrived">;
  drawHands: ResOf<"drawHands">;
  gameEnd: ResOf<"gameEnd">;
};
export type ResponseType<K extends MethodNames> = ResponseTypeCache[K];
