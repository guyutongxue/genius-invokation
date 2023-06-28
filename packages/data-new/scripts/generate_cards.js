// @ts-check
import db from "@genshin-db/tcg/src/min/data.min.json" assert { type: "json" };
import { pascalCase, snakeCase } from "case-anything";
import { fileURLToPath } from "node:url";
import { writeFile as write, mkdir } from "node:fs/promises";
import * as path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const outputDir = path.join(__dirname, "../data-template");

/**
 *
 * @param {string} file
 * @param {string} content
 */
async function writeFile(file, content) {
  const filePath = path.join(outputDir, file);
  await mkdir(path.dirname(filePath), { recursive: true });
  await write(filePath, content);
}

// @ts-ignore
const { data } = db;
const { English, ChineseSimplified } = data;

const charKey = "tcgcharactercards";
const cardKey = "tcgactioncards";

function getTypeAndTags(card) {
  const tagMap = {
    GCG_TAG_TALENT: "talent",
    GCG_TAG_SLOWLY: "action",
    GCG_TAG_FOOD: "food",
    GCG_TAG_ARTIFACT: "artifact",
    // 'GCG_TAG_WEAPON': "",
    GCG_TAG_WEAPON_BOW: "weaponBow",
    GCG_TAG_WEAPON_SWORD: "weaponSword",
    GCG_TAG_WEAPON_CATALYST: "weaponCatalyst",
    GCG_TAG_ALLY: "ally",
    GCG_TAG_PLACE: "place",
    GCG_TAG_RESONANCE: "resonance",
    GCG_TAG_WEAPON_POLE: "weaponPole",
    GCG_TAG_ITEM: "item",
    GCG_TAG_WEAPON_CLAYMORE: "weaponClaymore",
  };
  const tags = card.tags.map((t) => tagMap[t]).filter((t) => t);
  const typeMap = {
    GCG_CARD_ASSIST: "support",
    GCG_CARD_EVENT: "event",
    GCG_CARD_MODIFY: "equipment",
  };
  const type = typeMap[card.cardtype];
  return { type, tags };
}

function costMap(/** @type {string} */ s) {
  if (s === "GCG_COST_ENERGY") return "Energy";
  return s[14] + s.substring(15).toLowerCase();
}

function cardToCode(enObj, zhObj, targetDesc = "") {
  const { id, name, playcost } = enObj;
  const { type, tags } = getTypeAndTags(enObj);
  const { name: zhName, description: zhDesc } = zhObj;
  return `
/**
 * **${zhName}**
 * ${zhDesc.replace(/\n/g, "\n * ")}
 */
export const ${pascalCase(name)} = createCard(${id}${targetDesc})
  .setType("${type}")
  .addTags(${tags.map((t) => `"${t}"`).join(", ")})
  ${playcost.map((c) => `.cost${costMap(c.costtype)}(${c.count})`).join("\n  ")}
  // TODO
  .build();
`;
}

/**
 *
 * @param {string} enName
 */
function getTalentCardFor(enName) {
  for (const key in English[cardKey]) {
    const enObj = English[cardKey][key];
    if (
      enObj.tags.includes("GCG_TAG_TALENT") &&
      enObj.description.includes(`You must have ${enName}`)
    ) {
      const zhObj = ChineseSimplified[cardKey][key];
      return cardToCode(enObj, zhObj, ', ["character"]');
    }
  }
}
const TYPE_MAP = {
  GCG_SKILL_TAG_A: "normal",
  GCG_SKILL_TAG_E: "elemental",
  GCG_SKILL_TAG_Q: "burst",
  GCG_SKILL_TAG_PASSIVE: "passive",
};

for (const key in English[charKey]) {
  const enObj = English[charKey][key];
  const zhObj = ChineseSimplified[charKey][key];
  const filename = "characters/" + enObj.tags[0].split("_").pop().toLowerCase() + "/" + snakeCase(enObj.name) + ".ts";
  const varName = pascalCase(enObj.name);

  let code = `import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";
`;

  const skills = [];

  for (let i = 0; i < enObj.skills.length; i++) {
    const enSkill = enObj.skills[i];
    const zhSkill = zhObj.skills[i];
    const skillName = pascalCase(enSkill.name);
    const { typetag, playcost } = enSkill;
    const { name, description } = zhSkill;
    code += `
/**
 * **${name}**
 * ${description.replace(/\n/g, "\n * ")}
 */
const ${skillName} = createSkill(${enSkill.id})
  .setType("${TYPE_MAP[typetag]}")
  ${playcost.map((c) => `.cost${costMap(c.costtype)}(${c.count})`).join("\n  ")}
  // TODO
  .build();
`;
    skills.push(skillName);
  }
  code += `
export const ${varName} = createCharacter(${enObj.id})
  .addTags(${enObj.tags
    .map((t) => t.split("_").pop().toLowerCase())
    .filter((s) => s !== "none")
    .map((s) => `"${s}"`)
    .join(", ")})
  .addSkills(${skills.join(", ")})
  .build();
`;
  code += getTalentCardFor(enObj.name);
  await writeFile(filename, code);
}
const INIT_CARD_CODE = "import { createCard } from '@gi-tcg';\n";
const equipsCode = {
  weaponBow: INIT_CARD_CODE,
  weaponSword: INIT_CARD_CODE,
  weaponCatalyst: INIT_CARD_CODE,
  weaponPole: INIT_CARD_CODE,
  weaponClaymore: INIT_CARD_CODE,
  artifact: INIT_CARD_CODE,
};
const supportCode = {
  ally: INIT_CARD_CODE,
  place: INIT_CARD_CODE,
  item: INIT_CARD_CODE,
}
let foodCode = INIT_CARD_CODE;
let otherCode = INIT_CARD_CODE;

for (const key in English[cardKey]) {
  const enObj = English[cardKey][key];
  const zhObj = ChineseSimplified[cardKey][key];
  const { type, tags } = getTypeAndTags(enObj);
  if (tags.includes("talent")) continue;
  if (tags.includes("food")) {
    foodCode += cardToCode(enObj, zhObj);
  } else if (type === "equipment") {
    if (typeof equipsCode[tags[0]] === "undefined") {
      throw new Error("Unknown equip type: " + tags[0]);
    }
    equipsCode[tags[0]] += cardToCode(enObj, zhObj);
  } else if (type === "support") {
    if (typeof supportCode[tags[0]] === "undefined") {
      console.log(zhObj.name + " Unknown support type: " + tags[0]);
    }
    supportCode[tags[0]] += cardToCode(enObj, zhObj);
  } else {
    otherCode += cardToCode(enObj, zhObj);
  }
  await writeFile("cards/event/foods.ts", foodCode);
  await writeFile("cards/event/others.ts", otherCode);
  await writeFile("cards/equipment/weapons/bow.ts", equipsCode.weaponBow);
  await writeFile("cards/equipment/weapons/sword.ts", equipsCode.weaponSword);
  await writeFile("cards/equipment/weapons/catalyst.ts", equipsCode.weaponCatalyst);
  await writeFile("cards/equipment/weapons/pole.ts", equipsCode.weaponPole);
  await writeFile("cards/equipment/weapons/claymore.ts", equipsCode.weaponClaymore);
  await writeFile("cards/equipment/artifacts.ts", equipsCode.artifact);
  await writeFile("cards/support/allies.ts", supportCode.ally);
  await writeFile("cards/support/places.ts", supportCode.place);
  await writeFile("cards/support/items.ts", supportCode.item);
}
