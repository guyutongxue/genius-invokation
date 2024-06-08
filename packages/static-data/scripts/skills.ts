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

// Find DAMAGEVALUEPROP and ELEMENTVALUEPROP
const tmpf = readJson(
  `${config.input}/BinOutput/GCG/Gcg_DeclaredValueSet/Char_Skill_13023.json`,
);
const tmpo: any = Object.values(tmpf)[1];
tcgSkillKeyMap.DAMAGEVALUEPROP = Object.entries(tmpo["-2060930438"]).find(
  ([key, val]) => typeof val === "number",
)![0];
tcgSkillKeyMap.ELEMENTVALUEPROP = Object.entries(tmpo["476224977"]).find(
  ([key, val]) => typeof val === "string" && val.startsWith("GCG"),
)![0];
// console.log(tcgSkillKeyMap);
if (!tcgSkillKeyMap.DAMAGEVALUEPROP || !tcgSkillKeyMap.ELEMENTVALUEPROP)
  console.log("ERROR: loadTcgSkillKeyMap is missing a property map!");

for (const filename of filelist) {
  if (!filename.endsWith(".json")) continue;

  const fileObj = readJson(
    `${config.input}/BinOutput/GCG/Gcg_DeclaredValueSet/${filename}`,
  );

  try {
    const dataname = fileObj.name ?? filename.replace(".json", "");
    const uncutmap: any = Object.values(fileObj)[1];

    tcgSkillKeyMap[dataname] = {};

    for (let [key, kobj] of Object.entries(uncutmap) as [string, any][]) {
      switch (key) {
        case "-2060930438": // extract baseDamage
          tcgSkillKeyMap[dataname].baseDamage =
            kobj["value"] || kobj[tcgSkillKeyMap.DAMAGEVALUEPROP];
          if (tcgSkillKeyMap[dataname].baseDamage === undefined)
            console.log("loadTcgSkillKeyMap failed to extract baseDamage");
          break;
        case "476224977": // extract baseElement
          tcgSkillKeyMap[dataname].baseElement =
            kobj["ratio"] ||
            kobj[tcgSkillKeyMap.ELEMENTVALUEPROP] ||
            "GCG_ELEMENT_NONE";
          if (tcgSkillKeyMap[dataname].baseElement === undefined)
            console.log("loadTcgSkillKeyMap failed to extract baseElement");
          break;
        // case '-1197212178': // effectnum
        // 	tcgSkillKeyMap[dataname].effectnum = kobj['value'] || kobj[tcgSkillKeyMap.EFFECTNUMVALUEPROP];
        // 	if (tcgSkillKeyMap[dataname].effectnum === undefined) console.log('loadTcgSkillKeyMap failed to extract effectnum');
        // 	break;
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
  baseDamage?: number;
  baseElement?: string;
  icon?: string;
}

export async function collateSkill(langCode: string, skillId: number): Promise<SkillRawData> {
  const locale = getLanguage(langCode);
  const english = getLanguage("EN");
  const skillObj = xskill.find((e) => e.id === skillId)!;

  const id = skillId;
  const type = skillObj.skillTagList[0];
  const [name, englishName] = [locale, english].map((lc) =>
    sanitizeName(lc[skillObj.nameTextMapHash] ?? ""),
  );

  const rawDescription = locale[skillObj.descTextMapHash] ?? "";
  let baseDamage: number | undefined = void 0;
  let baseElement: string | undefined = void 0;
  if (tcgSkillKeyMap[skillObj.skillJson]) {
    if (rawDescription.includes("D__KEY__DAMAGE")) {
      baseDamage = tcgSkillKeyMap[skillObj.skillJson].baseDamage;
    }
    if (rawDescription.includes("D__KEY__ELEMENT")) {
      baseElement = tcgSkillKeyMap[skillObj.skillJson].baseElement;
    }
  }
  const descriptionReplaced = getDescriptionReplaced(rawDescription, locale, {
    baseElement,
    baseDamage,
  });
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
    baseDamage,
    baseElement,
    icon
  };
}
