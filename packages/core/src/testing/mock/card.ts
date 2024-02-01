import { CardDefinition, CardTag, CardType, SupportTag, WeaponCardTag } from "../../base/card";
import { DiceType } from "@gi-tcg/typings";
import { mockInitiativeSkill } from "./skill";

const MOCK_CARD_ID_START = 370000;
let mockCardId = MOCK_CARD_ID_START;

export interface MockCardOption {
  type?: "event" | "food" | WeaponCardTag | "artifact" | "equipment" | SupportTag;
  talent?: boolean;
  action?: boolean;
  legend?: boolean;
  cost?: DiceType[];
}

export function mockCard(option: MockCardOption = {}): CardDefinition {
  let type: CardType;
  const tags: CardTag[] = [];
  switch (option.type) {
    // @ts-expect-error
    case "food":
      tags.push("food");
    case "event":
    case void 0:
      type = "event";
      break;
    case "ally":
    case "place":
    case "item":
      type = "support";
      tags.push(option.type);
      break;
    case "bow":
    case "catalyst":
    case "claymore":
    case "pole":
    case "sword":
      type = "equipment";
      tags.push(option.type, "weapon");
      break;
    // @ts-expect-error
    case "artifact":
      tags.push("artifact");
    case "equipment":
      type = "equipment";
      break;
  }
  if (option.talent) {
    tags.push("talent");
  }
  if (option.action) {
    tags.push("action");
  }
  if (option.legend) {
    tags.push("legend");
  }
  const id = mockCardId++;
  return {
    id,
    type,
    tags,
    deckRequirement: {},
    getTarget: () => [],
    filter: () => true,
    skillDefinition: mockInitiativeSkill("card", option.cost ?? [])
  };
}
