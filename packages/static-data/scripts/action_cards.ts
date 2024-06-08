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
