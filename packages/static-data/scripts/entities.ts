import { readJson } from "./json";
import {
  getExcel,
  getLanguage,
  getPropNameWithMatch,
  sanitizeDescription,
  getDescriptionReplaced,
  sanitizeName,
  xcardview,
} from "./utils";

const xcard = getExcel("GCGCardExcelConfigData");

export interface EntityRawData {
  id: number;
  type: string;
  name: string;
  englishName: string;
  tags: string[];
  rawDescription: string;
  description: string;

  hidden: boolean;
  buffType?: string;
  hintType?: string;
  shownToken?: string;

  /** summons only */
  cardFaceFileName?: string;

  /** status / combat status only */
  buffIcon?: string;
  buffIconHash?: string;
}

function getBuffIconFileName(iconHash?: number | bigint): string | undefined {
  const data = readJson(`${import.meta.dirname}/mappings/buff_icons.json`);
  return iconHash ? data[String(iconHash)] : void 0;
}

export function collateEntities(langCode: string) {
  const locale = getLanguage(langCode);
  const english = getLanguage("EN");
  const result: EntityRawData[] = [];
  for (const obj of xcard) {
    if (
      ![
        "GCG_CARD_STATE", // 状态
        "GCG_CARD_MODIFY", // 装备
        "GCG_CARD_ONSTAGE", // 出战状态
        "GCG_CARD_SUMMON", // 召唤物
        "GCG_CARD_ASSIST", // 支援牌
      ].includes(obj.cardType)
    ) {
      // GCG_CARD_EVENT
      // console.log(obj.cardType);
      continue;
    }
    const hidden = !!obj.isHidden;

    if (!locale[obj.nameTextMapHash]) {
      continue;
    }

    const id = obj.id;
    const type = obj.cardType;
    const [name, englishName] = [locale, english].map((lc) =>
      sanitizeName(lc[obj.nameTextMapHash] ?? ""),
    );
    if (name === "") {
      continue;
    }

    const tags = obj.tagList.filter((e: any) => e !== "GCG_TAG_NONE");

    const rawDescription =
      locale[obj.descOnTableTextMapHash] ?? locale[obj.descTextMapHash] ?? "";
    const descriptionReplaced = getDescriptionReplaced(rawDescription, locale);
    const description = sanitizeDescription(descriptionReplaced, true);

    const buffType = obj.stateBuffType;
    const hintType = obj.hintType;
    const shownToken = obj.tokenToShow;
    const buffIcon = getBuffIconFileName(obj.buffIconHash);
    if (obj.buffIconHash && !buffIcon) {
      console.warn(
        `Entity ${id} ${name}'s icon (${obj.buffIconHash}) file name is missing now`,
      );
    }
    const buffIconHash = obj.buffIconHash ? String(obj.buffIconHash) : void 0;

    const data: EntityRawData = {
      id,
      type,
      name,
      englishName,
      tags,
      rawDescription,
      description,
      buffType,
      hintType,
      shownToken,
      hidden,
      buffIcon,
      buffIconHash,
    };

    if (type === "GCG_CARD_SUMMON") {
      const cardFace = xcardview.find((e) => e.id === obj.id)!.cardPrefabName;
      data.cardFaceFileName = `UI_${cardFace}`;
    }
    result.push(data);
  }
  return result;
}
