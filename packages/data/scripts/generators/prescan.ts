import db from "@genshin-db/tcg/src/min/data.min.json";

// @ts-ignore
const { data } = db;
const { English, ChineseSimplified } = data;

const CATEGORY_KEYS = {
  character: "tcgcharactercards",
  card: "tcgactioncards",
  status: "tcgstatuseffects",
  summon: "tcgsummons"
};

function read(name: keyof typeof CATEGORY_KEYS): any[] {
  const category = CATEGORY_KEYS[name];
  const result: any[] = [];
  for (const [key, value] of Object.entries<any>(English[category])) {
    const zh = ChineseSimplified[category][key];
    const mixed = {
      ...value,
      zhName: zh.name,
      zhDescription: zh.description ?? zh.storytext
    };
    if ("skills" in value) {
      const enSkills = [ ...value.skills ];
      const zhSkills = zh.skills;
      const mixedSkills: any[] = [];
      for (let i = 0; i < enSkills.length; i++) {
        const en = { ...enSkills[i] };
        const zh = zhSkills[i];
        mixedSkills.push({
          ...enSkills[i],
          zhName: zh.name,
          zhDescription: zh.description
        });
      }
      mixed.skills = mixedSkills;
    }
    result.push(mixed);
  }
  return result;
}

export const characters = read("character");
export const cards = read("card");
export const statuses = read("status");
export const summons = read("summon");

