import type { JSONSchema, FromSchema } from "json-schema-to-ts";
import Ajv from "ajv";
import { ACTION_SCHEMA } from "./actions.js";
import { EVENT_SCHEMA } from "./events.js";

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
    params: {},
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
    params: {},
    result: {
      hands: { type: "array", items: { type: "integer" } },
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

export type ApiType = typeof API;

export type MethodNames = keyof ApiType;

export type RequestType<K extends MethodNames> = {
  [P in keyof ApiType[K]["params"]]: FromSchema<ApiType[K]["params"][P]>;
};

export type ResponseType<K extends MethodNames> = {
  [P in keyof ApiType[K]["result"]]: FromSchema<ApiType[K]["result"][P]>;
};

const ajv = new Ajv();

export function verifyRequest(
  method: MethodNames,
  request: unknown
): string | undefined {
  const m = API[method];
  if (
    ajv.validate(
      {
        type: "object",
        required: Object.keys(m.params),
        // additionalProperties: false,
        properties: m.params,
      },
      request
    )
  ) {
    return undefined;
  } else {
    return ajv.errorsText();
  }
}

export function verifyResponse(
  method: MethodNames,
  response: unknown
): string | undefined {
  const m = API[method];
  if (
    ajv.validate(
      {
        type: "object",
        required: Object.keys(m.result),
        // additionalProperties: false,
        properties: m.result,
      },
      response
    )
  ) {
    return undefined;
  } else {
    return ajv.errorsText();
  }
}

export * from "./actions";
export * from "./events";
export * from "./elements";
