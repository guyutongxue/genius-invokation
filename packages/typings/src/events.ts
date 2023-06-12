import { FromSchema, JSONSchema } from "json-schema-to-ts";

export const EVENT_SCHEMA = {
  oneOf: [
    {
      type: "object",
      additionalProperties: false,
      properties: {
        type: { const: "peerPlayCard" },
        card: { type: "integer" },
      },
      required: ["type", "card"],
    },
    {
      type: "object",
      additionalProperties: false,
      properties: {
        type: { const: "peerSwitchActive" },
        active: { type: "integer" },
      },
    },
    {
      type: "object",
      additionalProperties: false,
      properties: {
        type: { const: "peerSwitchHands" },
        removeNum: { type: "integer" },
        addNum: { type: "integer" },
      },
      required: ["type", "removeNum", "addNum"],
    },
    {
      type: "object",
      additionalProperties: false,
      properties: {
        type: { const: "peerUseSkill" },
        name: { type: "string" },
      },
      required: ["type", "name"],
    },
    {
      type: "object",
      additionalProperties: false,
      properties: {
        type: { const: "peerElementalTuning" },
      },
      required: ["type"],
    },
    {
      type: "object",
      additionalProperties: false,
      properties: {
        type: { const: "peerDeclareEnd" },
      },
      required: ["type"],
    },
    {
      type: "object",
      additionalProperties: false,
      properties: {
        type: { const: "updateState" },
        state: { /* type: "object" */ },
        damages: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              from: {
                type: "object",
                additionalProperties: false,
                properties: {
                  type: { enum: ["character", "summon", "status"] },
                  id: { type: "integer" }, // character pos
                },
              },
              to: {
                type: "array",
                items: [
                  { enum: [0, 1] },   // me or opponent
                  { enum: [0, 1, 2] } // id (character pos)
                ],
                minItems: 2,
                maxItems: 2
              },
              value: { type: "integer" },
              element: { type: "integer", minimum: 0, maximum: 9 }
            }
          }
        }
      },
      required: ["type", "state"]
    }
  ]
} as const satisfies JSONSchema;
