import { pascalCase } from "case-anything";

import { getCostCode, isLegend } from "./cost";
import { SourceInfo, writeSourceCode } from "./source";
import { cards } from "../prescan";

export function getCardTypeAndTags(card: any) {
  const TAG_MAP: Record<string, string> = {
    // GCG_TAG_TALENT: "talent", // use talent
    GCG_TAG_SLOWLY: "action",
    GCG_TAG_FOOD: "food",
    GCG_TAG_ARTIFACT: "artifact",
    // GCG_TAG_WEAPON: "", // implicit defined
    GCG_TAG_WEAPON_BOW: "bow",
    GCG_TAG_WEAPON_SWORD: "sword",
    GCG_TAG_WEAPON_CATALYST: "catalyst",
    GCG_TAG_ALLY: "ally",
    GCG_TAG_PLACE: "place",
    GCG_TAG_RESONANCE: "resonance",
    GCG_TAG_WEAPON_POLE: "pole",
    GCG_TAG_ITEM: "item",
    GCG_TAG_WEAPON_CLAYMORE: "claymore",
  };
  const tags = (card.tags as any[]).map((t) => TAG_MAP[t]).filter((t) => t);
  const TYPE_MAP: Record<string, string> = {
    GCG_CARD_ASSIST: "support",
    GCG_CARD_EVENT: "event",
    GCG_CARD_MODIFY: "equipment",
  };
  const type = TYPE_MAP[card.cardtype];
  return { type, tags };
}

export function getCardCode(card: any, extra = ""): string {
  const { type, tags } = getCardTypeAndTags(card);
  let typeCode = "";
  if (type === "equipment") {
    const tag = tags.shift();
    if (tag === "artifact") {
      typeCode = `\n  .artifact()`;
    } else if (
      tag &&
      ["bow", "sword", "catalyst", "pole", "claymore"].includes(tag)
    ) {
      typeCode = `\n  .weapon("${tag}")`;
    }
  } else if (type === "support") {
    const tag = tags.shift();
    if (tag) {
      typeCode = `\n  .support("${tag}")`;
    } else {
      typeCode = `\n  .support()`;
    }
  }
  const tagCode =
    tags.length > 0 ? `\n  .tags(${tags.map((t) => `"${t}"`).join(", ")})` : "";
  const cost = getCostCode(card.playcost);
  return `export const ${pascalCase(card.name)} = card(${card.id})${cost}${tagCode}${extra}${typeCode}
  // TODO
  .done();`;
}

export async function generateCards() {
  const INIT_CARD_CODE = `import { card } from "@gi-tcg/core/builder";\n`;
  const equipsCode: Record<string, SourceInfo[]> = {
    bow: [],
    sword: [],
    catalyst: [],
    pole: [],
    claymore: [],
    artifact: [],
  };
  const supportCode: Record<string, SourceInfo[]> = {
    ally: [],
    place: [],
    item: [],
    other: [],
  };
  let foods: SourceInfo[] = [];
  let legends: SourceInfo[] = [];
  let others: SourceInfo[] = [];

  for (const card of cards) {
    if (card.tags.includes("GCG_TAG_TALENT")) {
      continue;
    }
    const { type, tags } = getCardTypeAndTags(card);
    let target: SourceInfo[];
    if (isLegend(card.playcost)) {
      target = legends;
    } else if (tags.includes("food")) {
      target = foods;
    } else if (type === "equipment") {
      if (typeof equipsCode[tags[0]] === "undefined") {
        throw new Error(`${card.id} ${card.zhName} has unsupported equip type`);
      }
      target = equipsCode[tags[0]];
    } else if (type === "support") {
      if (typeof supportCode[tags[0]] === "undefined") {
        target = supportCode.other;
      } else {
        target = supportCode[tags[0]];
      }
    } else {
      target = others;
    }
    target.push({
      id: card.id,
      name: card.zhName,
      description: card.zhDescription,
      code: getCardCode(card),
    });
  }
  return Promise.all([
    writeSourceCode("cards/event/food.ts", INIT_CARD_CODE, foods),
    writeSourceCode("cards/event/legend.ts", INIT_CARD_CODE, legends),
    writeSourceCode("cards/event/other.ts", INIT_CARD_CODE, others),
    writeSourceCode(
      "cards/equipment/weapon/bow.ts",
      INIT_CARD_CODE,
      equipsCode.bow,
    ),
    writeSourceCode(
      "cards/equipment/weapon/sword.ts",
      INIT_CARD_CODE,
      equipsCode.sword,
    ),
    writeSourceCode(
      "cards/equipment/weapon/catalyst.ts",
      INIT_CARD_CODE,
      equipsCode.catalyst,
    ),
    writeSourceCode(
      "cards/equipment/weapon/pole.ts",
      INIT_CARD_CODE,
      equipsCode.pole,
    ),
    writeSourceCode(
      "cards/equipment/weapon/claymore.ts",
      INIT_CARD_CODE,
      equipsCode.claymore,
    ),
    writeSourceCode(
      "cards/equipment/artifacts.ts",
      INIT_CARD_CODE,
      equipsCode.artifact,
    ),
    writeSourceCode("cards/support/ally.ts", INIT_CARD_CODE, supportCode.ally),
    writeSourceCode(
      "cards/support/place.ts",
      INIT_CARD_CODE,
      supportCode.place,
    ),
    writeSourceCode("cards/support/item.ts", INIT_CARD_CODE, supportCode.item),
    // writeSourceCode("cards/support/other.ts", INIT_CARD_CODE, supportCode.other),
  ]);
}
