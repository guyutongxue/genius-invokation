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
