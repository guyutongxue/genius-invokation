// Copyright (C) 2024 theBowja, Guyutongxue
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

import { config } from "./config";
import { readJson } from "./json";
import fs from "node:fs";
import {
  getLanguage,
  sanitizeDescription,
  sanitizeName,
  xskill,
  getDescriptionReplaced,
} from "./utils";
import { getSkillIcon } from "./skill_icon";

// Goes through binoutput to get data on tcg skill's damage and element
const tcgSkillKeyMap: Record<string, any> = {};
const filelist = fs.readdirSync(
  `${config.input}/BinOutput/GCG/Gcg_DeclaredValueSet`,
);

const D__KEY__DAMAGE = "-2060930438";
const D__KEY__ELEMENT = "476224977";
const D__KEY__DAMAGE_2 = "1428448537";
const D__KEY__DAMAGE_5 = "1428448540";

// Find DAMAGEVALUEPROP and ELEMENTVALUEPROP
const { declaredValueMap } = readJson(
  `${config.input}/BinOutput/GCG/Gcg_DeclaredValueSet/Char_Skill_13023.json`,
);
export const PROP_D__KEY__DAMAGE = Object.entries(
  declaredValueMap[D__KEY__DAMAGE],
).find(([key, val]) => typeof val === "number")![0];
export const PROP_D__KEY__DAMAGE_2 = PROP_D__KEY__DAMAGE;
export const PROP_D__KEY__DAMAGE_5 = PROP_D__KEY__DAMAGE;
export const PROP_D__KEY_ELEMENT = Object.entries(
  declaredValueMap[D__KEY__ELEMENT],
).find(([key, val]) => typeof val === "string" && val.startsWith("GCG"))![0];

for (const filename of filelist) {
  if (!filename.endsWith(".json")) continue;

  const fileObj = readJson(
    `${config.input}/BinOutput/GCG/Gcg_DeclaredValueSet/${filename}`,
  );

  try {
    const dataname = fileObj.name;
    if (`${dataname}.json` !== filename) {
      continue;
    }
    const uncutmap: any = Object.values(fileObj)[1];

    tcgSkillKeyMap[dataname] = {};

    for (let [key, kobj] of Object.entries(uncutmap) as [string, any][]) {
      switch (key) {
        case D__KEY__DAMAGE:
          tcgSkillKeyMap[dataname].D__KEY__DAMAGE = kobj[PROP_D__KEY__DAMAGE];
          if (tcgSkillKeyMap[dataname].D__KEY__DAMAGE === undefined)
            console.log("loadTcgSkillKeyMap failed to extract D__KEY__DAMAGE");
          break;
        case D__KEY__ELEMENT:
          tcgSkillKeyMap[dataname].D__KEY__ELEMENT = kobj[PROP_D__KEY_ELEMENT];
          // if (tcgSkillKeyMap[dataname].D__KEY__ELEMENT === undefined)
          //   console.log("loadTcgSkillKeyMap failed to extract D__KEY__ELEMENT");
          break;
        case D__KEY__DAMAGE_2:
          tcgSkillKeyMap[dataname].D__KEY__DAMAGE_2 = kobj[PROP_D__KEY__DAMAGE_2];
          if (tcgSkillKeyMap[dataname].D__KEY__DAMAGE_2 === undefined)
            console.log("loadTcgSkillKeyMap failed to extract D__KEY__DAMAGE_2");
          break;
        case D__KEY__DAMAGE_5:
          tcgSkillKeyMap[dataname].D__KEY__DAMAGE_5 = kobj[PROP_D__KEY__DAMAGE_5];
          if (tcgSkillKeyMap[dataname].D__KEY__DAMAGE_5 === undefined)
            console.log("loadTcgSkillKeyMap failed to extract D__KEY__DAMAGE_5");
          break;
      }
    }
  } catch (e) {
    continue;
  }
}
console.log("loadTcgSkillKeyMap done");

export interface PlayCost {
  type: string;
  count: number;
}

export interface SkillRawData {
  id: number;
  type: string;
  name: string;
  englishName: string;
  rawDescription: string;
  description: string;
  playCost: PlayCost[];
  keyMap: Record<string, any>;
  icon?: string;
}

export async function collateSkill(
  langCode: string,
  skillId: number,
): Promise<SkillRawData> {
  const locale = getLanguage(langCode);
  const english = getLanguage("EN");
  const skillObj = xskill.find((e) => e.id === skillId)!;

  const id = skillId;
  const type = skillObj.skillTagList[0];
  const [name, englishName] = [locale, english].map((lc) =>
    sanitizeName(lc[skillObj.nameTextMapHash] ?? ""),
  );

  const rawDescription = locale[skillObj.descTextMapHash] ?? "";
  const keyMap = tcgSkillKeyMap[skillObj.skillJson];
  const descriptionReplaced = getDescriptionReplaced(rawDescription, locale, keyMap);
  const description = sanitizeDescription(descriptionReplaced, true);

  const playCost = skillObj.costList
    .filter((e: any) => e.count)
    .map((e: any) => ({
      type: e.costType,
      count: e.count,
    }));

  const iconHash = skillObj.skillIconHash;
  const icon = await getSkillIcon(id, iconHash);
  // const icon = iconHash;

  return {
    id,
    name,
    englishName,
    type,
    rawDescription,
    description,
    playCost,
    keyMap,
    icon,
  };
}
