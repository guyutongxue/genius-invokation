import path from "node:path";
import allData from "@genshin-db/tcg/src/min/data.min.json";

const {
  data: { ChineseSimplified },
} = allData as any;

const keys = [
  "tcgcharactercards",
  "tcgactioncards",
  "tcgstatuseffects",
  "tcgsummons",
];

const result: Record<string, string> = {};

for (const key of keys) {
  for (const value of <any>Object.values(ChineseSimplified[key])) {
    const { id, name } = value;
    if ("skills" in value) {
      for (const { id, name } of value.skills) {
        result[id] = name;
      }
    }
    result[id] = name;
  }
}

const RESULT_PATH = path.join(import.meta.dirname, "../src/names.json");

await Bun.write(RESULT_PATH, JSON.stringify(result, null, 2));
