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

import { characters, entities, actionCards, EntityRawData } from "@gi-tcg/static-data";
import { pascalCase, snakeCase } from "case-anything";
import { writeSourceCode, SourceInfo } from "./source";
import { getCostCode } from "./cost";
import { getCardCode, getCardTypeAndTags } from "./cards";

interface AuxiliaryFound {
  hasSummon: boolean;
  hasStatuses: boolean;
  hasCombatStatuses: boolean;
  items: SourceInfo[];
}

function getAuxiliaryOfCharacter(id: number): AuxiliaryFound {
  const candidates: EntityRawData[] = [];
  for (const obj of entities) {
    if (
      Math.floor(obj.id / 10) === 10000 + id &&
      !candidates.find((c) => c.id === obj.id)
    ) {
      candidates.push(obj);
    }
  }
  const mySummons: (EntityRawData & { kind: string })[] = [];
  const myStatuses: (EntityRawData & { kind: string })[] = [];
  const myCombatStatuses: (EntityRawData & { kind: string })[] = [];
  for (const obj of candidates) {
    switch (obj.type) {
      case "GCG_CARD_SUMMON":
        mySummons.push({ ...obj, kind: "summon" });
        break;
      case "GCG_CARD_STATE":
        myStatuses.push({ ...obj, kind: "status" });
        break;
      case "GCG_CARD_ONSTAGE":
        myCombatStatuses.push({ ...obj, kind: "combatStatus" });
        break;
    }
  }
  const items = [
    ...mySummons,
    ...myStatuses,
    ...myCombatStatuses,
  ].map<SourceInfo>((obj) => {
    return {
      id: obj.id,
      name: obj.name,
      description: obj.description,
      code: `export const ${pascalCase(obj.englishName)} = ${obj.kind}(${obj.id})
  // TODO
  .done();`,
    };
  });
  return {
    hasSummon: mySummons.length > 0,
    hasStatuses: myStatuses.length > 0,
    hasCombatStatuses: myCombatStatuses.length > 0,
    items,
  };
}

function getTalentCard(id: number, name: string): SourceInfo[] {
  const card = actionCards.find(
    (c) =>
      c.tags.includes("GCG_TAG_TALENT") && Math.floor(c.id / 10) === 20000 + id,
  );
  if (!card) {
    return [];
  }
  const { type } = getCardTypeAndTags(card);
  const methodName = type === "equipment" ? "talent" : "eventTalent";
  return [
    {
      id: card.id,
      name: card.name,
      description: card.description,
      code: getCardCode(
        card,
        `\n  .${methodName}(${pascalCase(name)})`,
      ),
    },
  ];
}

export async function generateCharacters() {
  for (const ch of characters) {
    const filename =
      "characters/" +
      ch.tags[0].split("_").pop()!.toLowerCase() +
      "/" +
      snakeCase(ch.englishName) +
      ".ts";

    const { hasSummon, hasStatuses, hasCombatStatuses, items } =
      getAuxiliaryOfCharacter(ch.id);
    const importDecls = ["character", "skill"];
    if (hasSummon) importDecls.push("summon");
    if (hasStatuses) importDecls.push("status");
    if (hasCombatStatuses) importDecls.push("combatStatus");
    const initCode = `import { ${importDecls.join(
      ", ",
    )}, card, DamageType } from "@gi-tcg/core/builder";\n`;
    const skills = ch.skills;

    items.push(
      ...skills.map<SourceInfo>((sk) => {
        const TYPE_MAP: Record<string, string> = {
          GCG_SKILL_TAG_A: "normal",
          GCG_SKILL_TAG_E: "elemental",
          GCG_SKILL_TAG_Q: "burst",
          GCG_SKILL_TAG_PASSIVE: "passive",
        };
        return {
          id: sk.id,
          name: sk.name,
          description: sk.description,
          code: `export const ${pascalCase(sk.englishName)} = skill(${sk.id})
  .type("${TYPE_MAP[sk.type]}")${getCostCode(sk.playCost)}
  // TODO
  .done();`,
        };
      }),
    );

    const tagCode = (ch.tags as any[])
      .map((t) => t.split("_").pop().toLowerCase())
      .filter((s) => s !== "none")
      .map((s) => `"${s}"`)
      .join(", ");

    items.push({
      id: ch.id,
      name: ch.name,
      description: ch.storyText ?? "",
      code: `export const ${pascalCase(ch.englishName)} = character(${ch.id})
  .tags(${tagCode})
  .health(${ch.hp})
  .energy(${ch.maxEnergy})
  .skills(${skills.map((sk) => pascalCase(sk.englishName)).join(", ")})
  .done();`,
    });
    items.push(...getTalentCard(ch.id, ch.englishName));

    await writeSourceCode(filename, initCode, items, true);
  }
}
