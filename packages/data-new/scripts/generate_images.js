// @ts-check
import db from "@genshin-db/tcg/src/min/data.min.json" assert { type: "json" };
import { fileURLToPath } from "node:url";
import { writeFile } from "node:fs/promises";
import * as path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// @ts-ignore
const { data: { English }, image } = db;

const charKey = "tcgcharactercards";
const cardKey = "tcgactioncards";
const summKey = "tcgsummons"

/** @type {Record<number, string>} */
const result = {};

for (const key in English[charKey]) {
  const enObj = English[charKey][key];
  const imageObj = image[charKey][key];
  result[enObj.id] = "https://api.ambr.top/assets/UI/gcg/" + imageObj["filename_cardface"] + ".png";
}
for (const key in English[cardKey]) {
  const enObj = English[cardKey][key];
  const imageObj = image[cardKey][key];
  result[enObj.id] = "https://api.ambr.top/assets/UI/gcg/" + imageObj["filename_cardface"] + ".png";
}
// for (const key in English[summKey]) {
//   const enObj = English[summKey][key];
//   const imageObj = image[summKey][key];
//   result[enObj.id] = "https://api.ambr.top/assets/UI/gcg/" + imageObj["filename_cardface"] + ".png";
// }

await writeFile(path.join(__dirname, "./images.json"), JSON.stringify(result, null, 2));
