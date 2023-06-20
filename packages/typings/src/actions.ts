import type { FromSchema, JSONSchema } from "json-schema-to-ts";

export const ACTION_SCHEMA = {
  oneOf: [
    {
      type: "object",
      additionalProperties: false,
      properties: {
        type: { const: "useSkill" },
        cost: { type: "array", items: { type: "integer" } },
        name: { type: "string" },
      },
      required: ["type", "cost", "name"],
    },
    {
      type: "object",
      additionalProperties: false,
      properties: {
        type: { const: "switchActive" },
        cost: { type: "array", items: { type: "integer" } },
        target: { type: "integer" },
      },
      required: ["type", "target", "cost"],
    },
    {
      type: "object",
      additionalProperties: false,
      properties: {
        type: { const: "playCard" },
        card: { type: "number" },
        cost: { type: "array", items: { type: "integer" } },
        with: {
          // type: "array",
          // items: {
            type: "object", 
            additionalProperties: false,
            properties: {
              type: { enum: ["character", "summon", "support"] },
              id: { type: "number" }, 
            },
            required: ["type", "id"]
          // },
        },
        removeSupport: { type: "integer" },
      },
      required: ["type", "card", "cost"],
    },
    {
      type: "object",
      additionalProperties: false,
      properties: {
        card: { type: "number" },
        type: { const: "elementalTuning" },
      },
      required: ["type", "card"],
    },
    {
      type: "object",
      additionalProperties: false,
      properties: {
        type: { const: "declareEnd" },
      },
      required: ["type"],
    },
  ],
} as const satisfies JSONSchema;

export type Action = FromSchema<typeof ACTION_SCHEMA>;
