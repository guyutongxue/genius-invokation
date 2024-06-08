import { collateActionCards } from "./action_cards";
import { collateCharacters } from "./characters";
import { collateEntities } from "./entities";
import { collateKeywords } from "./keywords";
import { config } from "./config";
import { stringify as stringifyLossless } from "lossless-json";
import fs from "node:fs";

const USE_ES_JSON = true;
const stringify = USE_ES_JSON ? JSON.stringify : stringifyLossless;

export async function exportData(
  filename: string,
  langCode: string,
  collateFunc: (langCode: string) => any,
) {
  const data = await collateFunc(langCode);
  fs.mkdirSync(`${config.output}`, { recursive: true });
  const content = stringify(data, void 0, 2)!;
  fs.writeFileSync(`${config.output}/${filename}.json`, content);
  if (content.search("undefined") !== -1) {
    console.warn("undefined found in " + filename);
  }
}

await exportData("characters", "CHS", collateCharacters);
await exportData("action_cards", "CHS", collateActionCards);
await exportData("entities", "CHS", collateEntities);
await exportData("keywords", "CHS", collateKeywords);
