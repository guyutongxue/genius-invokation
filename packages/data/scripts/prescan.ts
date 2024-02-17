// Copyright (C) 2024 Guyutongxue
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import db from "@genshin-db/tcg/src/min/data.min.json";

// @ts-ignore
const { data, image } = db;
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
    const zh = ChineseSimplified[category][key] ?? value;
    const imageObj = image[category]?.[key];
    const mixed = {
      ...value,
      image: imageObj,
      zhName: zh.name,
      zhDescription: zh.description ?? zh.storytext ?? ""
    };
    if ("skills" in value) {
      const enSkills = [ ...value.skills ];
      const zhSkills = zh.skills;
      const mixedSkills: any[] = [];
      for (let i = 0; i < enSkills.length; i++) {
        const zh = zhSkills[i] ?? enSkills[i];
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

