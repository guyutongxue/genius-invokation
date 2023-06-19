import type { JSONSchema, FromSchema } from "json-schema-to-ts";
import { ACTION_SCHEMA } from "./actions.js";
import { EVENT_SCHEMA } from "./events.js";

export const API = {
  initialize: {
    params: {
      first: { type: "boolean" },
      state: {}
    },
    result: { success: { const: true } },
  },
  removeHands: {
    params: {
      hands: { type: "array", items: { type: "number" } },
    },
    result: {
      remove: { type: "array", items: { type: "number" } },
    },
  },
  switchActive: {
    params: {
      targets: { type: "array", items: { type: "integer" } },
    },
    result: {
      target: { type: "integer", minimum: 0, maximum: 2 },
    },
  },
  roll: {
    params: {
      dice: { type: "array", items: { type: "integer" } },
      canRemove: { type: "boolean" },
    },
    result: {
      remove: { type: "array", items: { type: "integer" } },
    },
  },
  action: {
    params: {
      skills: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            cost: { type: "array", items: { type: "integer" } },
          },
          required: ["name", "cost"],
        },
      },
      cards: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "number" },
            cost: { type: "array", items: { type: "integer" } },
            with: {
              type: "array",
              items: {
                type: "object", 
                additionalProperties: false,
                properties: {
                  type: { enum: ["character", "summon", "support"] },
                  id: { type: "number" }, 
                },
                required: ["type", "who"]
              },
            },
            removeSupport: { type: "boolean" },
          },
          required: ["id", "cost"],
        },
      },
      switchActive: {
        type: "object",
        additionalProperties: false,
        properties: {
          targets: { type: "array", items: { type: "integer" } },
          fast: { type: "boolean" },
          cost: { type: "array", items: { type: "integer" } },
        },
        required: ["targets", "fast", "cost"],
      },
    },
    result: {
      action: ACTION_SCHEMA,
    },
  },
  notify: {
    params: {
      event: EVENT_SCHEMA,
    },
    result: {},
  },
  drawHands: {
    params: {
      hands: { type: "array", items: { type: "number" } },
      discard: { type: "array", items: { type: "number" } },
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
  removeHands: ReqOf<"removeHands">;
  switchActive: ReqOf<"switchActive">;
  roll: ReqOf<"roll">;
  action: ReqOf<"action">;
  notify: ReqOf<"notify">;
  drawHands: ReqOf<"drawHands">;
  gameEnd: ReqOf<"gameEnd">;
};
export type RequestType<K extends MethodNames> = RequestTypeCache[K];

type ResOf<K extends MethodNames> = {
  [P in keyof ApiType[K]["result"]]: FromSchema<ApiType[K]["result"][P]>;
};
type ResponseTypeCache = {
  initialize: ResOf<"initialize">;
  removeHands: ResOf<"removeHands">;
  switchActive: ResOf<"switchActive">;
  roll: ResOf<"roll">;
  action: ResOf<"action">;
  notify: ResOf<"notify">;
  drawHands: ResOf<"drawHands">;
  gameEnd: ResOf<"gameEnd">;
};
export type ResponseType<K extends MethodNames> = ResponseTypeCache[K];
