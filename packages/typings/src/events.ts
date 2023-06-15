import { FromSchema, JSONSchema } from "json-schema-to-ts";

export const EVENT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    state: {},
    source: {
      oneOf: [
        {
          type: "object",
          additionalProperties: false,
          properties: {
            type: { const: "phaseBegin" },
            phase: { enum: ["roll", "action", "end"] },
            roundNumber: { type: "integer" }, // only show on roll phase
            isFirst: { type: "boolean" },     // only show on roll phase
          },
          required: ["type", "phase"],
        },
        {
          type: "object",
          additionalProperties: false,
          properties: {
            type: { enum: ["support", "summon", "status"] },
            id: { type: "integer" },
          },
          required: ["type", "id"],
        },
        {
          type: "object",
          additionalProperties: false,
          properties: {
            type: { const: "oppSwitchHands" },
            addNum: { type: "integer" },
            removeNum: { type: "integer" },
            discardNum: { type: "integer" },
          },
          required: ["type"],
        },
        {
          type: "object",
          additionalProperties: false,
          properties: {
            type: { const: "oppDeclareEnd" },
          },
          required: ["type"],
        },
        {
          type: "object",
          additionalProperties: false,
          properties: {
            type: { const: "useSkill" },
            id: { type: "integer" }, // 0-3 me 4-6 opponent
            name: { type: "string" },
          },
          required: ["type", "id", "name"],
        },
        {
          type: "object",
          additionalProperties: false,
          properties: {
            type: { const: "playCard" },
            who: { enum: [0, 1] }, // me or opponent
            card: { type: "number" },
          },
          required: ["type", "who", "card"],
        },
        {
          type: "object",
          additionalProperties: false,
          properties: {
            type: { const: "switchActive" },
            // who: { enum: [0, 1] },
            target: { type: "integer" },
          },
          required: ["type", "target"],
        },
      ],
    },
    damages: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          target: { type: "integer" },
          value: { type: "integer" },
          element: { type: "integer", minimum: 0, maximum: 9 },
        },
        required: ["target", "value", "element"],
      },
    },
  },
  required: ["state", "source"],
} as const satisfies JSONSchema;

export type Event = FromSchema<typeof EVENT_SCHEMA>;
