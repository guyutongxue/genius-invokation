import {
  getDescriptionReplaced,
  getExcel,
  getLanguage,
  sanitizeDescription,
  sanitizeName,
} from "./utils";

const xkey = getExcel("GCGKeywordExcelConfigData");

export interface KeywordRawData {
  id: number;
	rawName: string;
  name: string;
  rawDescription: string;
  description: string;
}

export function collateKeywords(langCode: string) {
  const locale = getLanguage(langCode);
  const english = getLanguage("EN");
  const result: KeywordRawData[] = [];
  for (const obj of xkey) {
    const id = obj.id;
		const rawName = locale[obj.titleTextMapHash];
    const name = sanitizeDescription(rawName, true);
    const rawDescription = locale[obj.descTextMapHash] ?? "";
    const descriptionReplaced = getDescriptionReplaced(rawDescription, locale);
    const description = sanitizeDescription(descriptionReplaced, true);

    result.push({
      id,
			rawName,
      name,
      rawDescription,
      description,
    });
  }
  return result;
}
