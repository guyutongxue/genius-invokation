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

import { collateSkill, type SkillRawData } from "./skills";
import {
  getLanguage,
  sanitizeDescription,
  sanitizeName,
  propShareId,
  wandererNameTextMapHash,
  xcardview,
  xchar,
  xdeckcard,
} from "./utils";

export interface CharacterRawData {
  id: number;
  obtainable: boolean;
  shareId?: number;
  name: string;
  englishName: string;
  tags: string[];
  storyTitle?: string;
  storyText?: string;
  skills: SkillRawData[];
  hp: number;
  maxEnergy: number;
  cardFace: string;
}

export async function collateCharacters(langCode: string): Promise<CharacterRawData[]> {
  const locale = getLanguage(langCode);
  const english = getLanguage("EN");
  const result: CharacterRawData[] = [];
  for (const obj of xchar) {
    if (obj.skillList.includes(80)) {
      continue;
    }
    if (obj.isRemoveAfterDie) {
      continue;
    }
    const obtainable = !!obj.isCanObtain;
    const deckcardObj = xdeckcard.find((e) => e.id === obj.id);

    let isWanderer = false;

    const id = obj.id;

    if (locale[obj.nameTextMapHash].includes("ID(1)")) isWanderer = true;

    let nameTextMapHash = isWanderer
      ? wandererNameTextMapHash
      : obj.nameTextMapHash;
    const [name, englishName] = [locale, english].map((lc) =>
      sanitizeName(lc[nameTextMapHash]),
    );

    const shareId = deckcardObj?.[propShareId];
    const storyTitle = deckcardObj
      ? locale[deckcardObj.storyTitleTextMapHash]
      : void 0;
    const storyText = deckcardObj
      ? sanitizeDescription(locale[deckcardObj.storyDescTextMapHash])
      : void 0;

    const hp = obj.hp;
    const maxEnergy = obj.maxEnergy;

    const tags: string[] = obj.tagList.filter(
      (e: any) => e !== "GCG_TAG_NONE",
    );
    const skills: SkillRawData[] = [];
    for (const skillId of obj.skillList) {
      skills.push(await collateSkill(langCode, skillId));
    }

    const cardPrefabName = xcardview.find((e) => e.id === obj.id)!.cardPrefabName;
    const cardFace = `UI_${cardPrefabName}`;

    result.push({
      id,
      shareId,
      obtainable,
      name,
      englishName,
      tags,
      storyTitle,
      storyText,
      skills,
      hp,
      maxEnergy,
      cardFace,
    });
  }
  return result;
}
