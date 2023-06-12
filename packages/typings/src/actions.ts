import type { FromSchema, JSONSchema } from "json-schema-to-ts";

export const ACTION_SCHEMA = {
  anyOf: [
    {
      properties: {
        cost: {
          type: "object",
          patternProperties: {
            "/d": {
              type: "integer"
            }
          }
        },
        name: {
          type: "string",
        },
        type: {
          const: "useSkill",
          type: "string",
        },
      },
      type: "object",
      required: ["type", "cost", "name"],
      additionalProperties: false,
    },
    {
      properties: {
        available: {
          items: {
            type: "integer",
          },
          type: "array",
        },
        type: {
          const: "switchCharacter",
          type: "string",
        },
      },
      type: "object",
      required: ["type", "available"],
      additionalProperties: false,
    },
    {
      properties: {
        card: {
          type: "integer",
        },
        type: {
          const: "playCard",
          type: "string",
        },
      },
      type: "object",
      required: ["type", "card"],
      additionalProperties: false,
    },
    {
      properties: {
        card: {
          type: "integer",
        },
        type: {
          const: "elementalTuning",
          type: "string",
        },
      },
      type: "object",
      required: ["type", "card"],
      additionalProperties: false,
    },
    {
      properties: {
        type: {
          const: "declareEnd",
          type: "string",
        },
      },
      type: "object",
      required: ["type"],
      additionalProperties: false,
    },
    {
      properties: {
        type: {
          const: "giveUp",
          type: "string",
        },
      },
      type: "object",
      required: ["type"],
      additionalProperties: false,
    },
  ],
} as const satisfies JSONSchema;

export type Action = FromSchema<typeof ACTION_SCHEMA>;
