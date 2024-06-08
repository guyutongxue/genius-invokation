import type { PlayCost } from "./skills";
import {
  getDescriptionReplaced,
  getLanguage,
  sanitizeDescription,
  sanitizeName,
  xcardview,
  xdeckcard,
  xcard,
  getPropNameWithMatch,
  propShareId,
} from "./utils";

const propPlayingDescription = getPropNameWithMatch(
  xcard,
  "id",
  330005,
  3076893924,
);

export interface ActionCardRawData {
  id: number;
  type: string;
  obtainable: boolean;
  shareId?: number;
  name: string;
  englishName: string;
  tags: string[];
  storyTitle?: string;
  storyText?: string;
  rawDescription: string;
  description: string;
  rawPlayingDescription?: string;
  playingDescription?: string;
  playCost: PlayCost[];
  cardFaceFileName: string;
}

export function collateActionCards(langCode: string) {
  const locale = getLanguage(langCode);
  const english = getLanguage("EN");
  const result: ActionCardRawData[] = [];
  for (const obj of xcard) {
    if (
      !["GCG_CARD_EVENT", "GCG_CARD_MODIFY", "GCG_CARD_ASSIST"].includes(
        obj.cardType,
      )
    ) {
      continue;
    }
    if (!locale[obj.nameTextMapHash]) {
      continue;
    }

    const id = obj.id;
    const type = obj.cardType;
    const [name, englishName] = [locale, english].map((lc) =>
      sanitizeName(lc[obj.nameTextMapHash] ?? ""),
    );
    const obtainable = !!obj.isCanObtain;
    const tags = obj.tagList.filter((e: string) => e !== "GCG_TAG_NONE");

    const deckcardObj = xdeckcard.find((e) => e.id === obj.id);

    const shareId = deckcardObj?.[propShareId];
    const storyTitle = deckcardObj
      ? locale[deckcardObj.storyTitleTextMapHash]
      : void 0;
    const storyText = deckcardObj
      ? sanitizeDescription(locale[deckcardObj.storyDescTextMapHash])
      : void 0;

    const rawDescription = locale[obj.descTextMapHash] ?? "";
    const descriptionReplaced = getDescriptionReplaced(rawDescription, locale);
    const description = sanitizeDescription(descriptionReplaced, true);

    const rawPlayingDescription: string | undefined =
      locale[obj[propPlayingDescription]];
    let playingDescription: string | undefined = void 0;
    if (rawPlayingDescription) {
      const playingDescriptionReplaced = getDescriptionReplaced(
        rawPlayingDescription,
        locale,
      );
      playingDescription = sanitizeDescription(playingDescriptionReplaced);
    }

    const playCost = obj.costList
      .filter((e: any) => e.count)
      .map((e: any) => ({
        type: e.costType,
        count: e.count,
      }));

    const cardFace = xcardview.find((e) => e.id === obj.id)!.cardPrefabName;
    const cardFaceFileName = `UI_${cardFace}`;

    result.push({
      id,
      shareId,
      obtainable,
      type,
      name,
      englishName,
      tags,
      storyTitle,
      storyText,
      playCost,
      rawDescription,
      description,
      rawPlayingDescription,
      playingDescription,
      cardFaceFileName,
    });
  }
  return result;
}
