//
// 从 @genshin-db/tcg 下载得到的 data.min.json 生成文件模板

import { readFile,appendFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

function nameToCamel(original, upper) {
  original = original.replace(/[^a-zA-Z]/g, " ");
  const [first, ...rest] = original.split(" ").filter((s) => s);
  return `${
    upper ? first[0].toUpperCase() + first.slice(1) : first.toLowerCase()
  }${rest.map((s) => s[0].toUpperCase() + s.slice(1)).join("")}`;
}

const json = await readFile("./data.min.json", "utf-8");

const data = JSON.parse(json);

const en = data["data"]["English"];
const zh = data["data"]["ChineseSimplified"];

const cards = Object.values(en.tcgactioncards);
const zhCards = Object.values(zh.tcgactioncards);

const types = new Set();
function getTypeAndTags(card) {
  const tagMap = {
    'GCG_TAG_TALENT': "talent",
  'GCG_TAG_SLOWLY': "action",
  'GCG_TAG_FOOD': "food",
  'GCG_TAG_ARTIFACT': "artifact",
  // 'GCG_TAG_WEAPON': "",
  'GCG_TAG_WEAPON_BOW': "weaponBow",
  'GCG_TAG_WEAPON_SWORD': "weaponSword",
  'GCG_TAG_WEAPON_CATALYST': "weaponCatalyst",
  'GCG_TAG_ALLY': "ally",
  'GCG_TAG_PLACE': "place",
  'GCG_TAG_RESONANCE': "resonance",
  'GCG_TAG_WEAPON_POLE': "weaponPole",
  'GCG_TAG_ITEM': "item",
  'GCG_TAG_WEAPON_CLAYMORE': "weaponClaymore"
  };
  const tags = card.tags.map(t => tagMap[t]).filter(t => t);
  const typeMap = {
    GCG_CARD_ASSIST: "assist",
    GCG_CARD_EVENT: "event",
    GCG_CARD_MODIFY: "modify",
  }
  const type = typeMap[card.cardtype];
  return { type, tags };
}

function costMap(/** @type {string} */ s) {
  if (s === "GCG_COST_ENERGY") return "Energy";
  return s[14] + s.substring(15).toLowerCase();
}

async function createDirAndAppend(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await appendFile(path, content);
}

function getCode(card, zhCard) {
  const { type, tags } = getTypeAndTags(card);
  return `@Card({
  id: ${card.id},
  type: "${type}",
  tags: ${JSON.stringify(tags)},
})
${card.playcost.map((c) => `@${costMap(c.costtype)}(${c.count})`).join("\n  ")}
class ${nameToCamel(card.name, true)} implements ICard {
  onUse(c: Context) {
    // ${zhCard.description.split("\n").join("\n    // ")}
  }
}

`
}

for (let i = 0; i < cards.length; i++) {
  const card = cards[i];
  const zhCard = zhCards[i];
  const { type, tags } = getTypeAndTags(card);
  if (tags.includes("food")) {
    createDirAndAppend("./temp/foods.ts", getCode(card, zhCard));
  } else if (tags.includes("talent")) {
    createDirAndAppend("./temp/talents.ts", getCode(card, zhCard));
  } else if (tags.includes("artifact")) {
    createDirAndAppend("./temp/artifacts.ts", getCode(card, zhCard));
  } else if (tags.includes("weaponSword")) {
    createDirAndAppend("./temp/swords.ts", getCode(card, zhCard));
  } else if (tags.includes("weaponBow")) {
    createDirAndAppend("./temp/bows.ts", getCode(card, zhCard));
  } else if (tags.includes("weaponCatalyst")) {
    createDirAndAppend("./temp/catalysts.ts", getCode(card, zhCard));
  } else if (tags.includes("weaponClaymore")) {
    createDirAndAppend("./temp/claymores.ts", getCode(card, zhCard));
  } else if (tags.includes("weaponPole")) {
    createDirAndAppend("./temp/poles.ts", getCode(card, zhCard));
  } else if (tags.includes("item")) {
    createDirAndAppend("./temp/items.ts", getCode(card, zhCard));
  } else if (tags.includes("resonance")) {
    createDirAndAppend("./temp/resonances.ts", getCode(card, zhCard));
  } else if (tags.includes("ally")) {
    createDirAndAppend("./temp/allies.ts", getCode(card, zhCard));
  } else if (tags.includes("place")) {
    createDirAndAppend("./temp/places.ts", getCode(card, zhCard));
  } else {
    createDirAndAppend("./temp/other.ts", getCode(card, zhCard));
  }
}
console.log(types);
