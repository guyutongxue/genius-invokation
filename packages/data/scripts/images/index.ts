import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { characters, cards, summons } from "../prescan";
// generated from get_skill_images.ts
import skillImages from "./skill.json";
// generated from https://github.com/Guyutongxue/gcg-buff-icon-data
import statusImages from "./status.json";

const filenameMap = new Map<string, string>([
  ...Object.entries(skillImages),
  ...Object.entries(statusImages),
]);

for (const obj of [...characters, ...cards, ...summons]) {
  if (filenameMap.has(obj.id)) {
    console.warn(`Duplicate ID: ${obj.id}`);
  }
  let cardImageFilename = obj.image.filename_cardface;
  // Some fix
  if (cardImageFilename === "UI_Gcg_CardFace_Summon_AbyssEle") {
    cardImageFilename = "UI_Gcg_CardFace_Summon_AbyssEle_Layer00";
  }
  filenameMap.set(obj.id, cardImageFilename);
}

console.log(filenameMap);

const imagePath = path.join(
  fileURLToPath(import.meta.url),
  "../../../images/Sprite",
);

if (!existsSync(imagePath)) {
  throw new Error(
    `Image path does not exist: ${imagePath}\nFollow instructions in README.md to extract images`,
  );
}

const files = await readdir(imagePath);

for (const [k, v] of filenameMap) {
  const filename = `${v}.png`;
  if (!files.includes(filename)) {
    console.warn(`Missing image: ${filename}`);
  }
}
