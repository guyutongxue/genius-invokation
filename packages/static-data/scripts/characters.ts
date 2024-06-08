import { collateSkill, type SkillRawData } from "./skills";
import {
  getExcel,
  getLanguage,
  getPropNameWithMatch,
  sanitizeDescription,
  sanitizeName,
  propShareId,
  wandererNameTextMapHash,
  xcardview,
  xchar,
  xdeckcard,
} from "./utils";

// const propHp = "hp";
// const propMaxEnergy = "maxEnergy";
// const propObtainable = "isCanObtain";
// const propEnemy = "isRemoveAfterDie";
// const propTags = "tagList";

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
  cardFaceFileName: string;
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

    const cardFace = xcardview.find((e) => e.id === obj.id)!.cardPrefabName;
    const cardFaceFileName = `UI_${cardFace}`;

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
      cardFaceFileName,
    });
  }
  return result;
}
