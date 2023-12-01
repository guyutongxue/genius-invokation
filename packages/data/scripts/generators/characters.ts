import { characters, statuses, summons, cards } from "../prescan";
import { pascalCase, snakeCase } from "case-anything";
import { writeSourceCode, SourceInfo } from "./source";
import { getCostCode } from "./cost";
import { getCardCode } from "./cards";

interface AuxiliaryFound {
  hasSummon: boolean;
  hasStatuses: boolean;
  hasCombatStatuses: boolean;
  items: SourceInfo[];
}

function getAuxiliaryOfCharacter(id: number): AuxiliaryFound {
  const candidates: any[] = [];
  for (const obj of [...summons, ...statuses]) {
    if (
      Math.floor(obj.id / 10) === 10000 + id &&
      !candidates.find((c) => c.id === obj.id)
    ) {
      candidates.push(obj);
    }
  }
  const mySummons: any[] = [];
  const myStatuses: any[] = [];
  const myCombatStatuses: any[] = [];
  for (const obj of candidates) {
    switch (obj.cardtype) {
      case void 0:
        mySummons.push({ obj, kind: "summon" });
        break;
      case "GCG_CARD_STATE":
        myStatuses.push({ obj, kind: "status" });
        break;
      case "GCG_CARD_ONSTAGE":
        myCombatStatuses.push({ obj, kind: "combatStatus" });
        break;
    }
  }
  const items = [
    ...mySummons,
    ...myStatuses,
    ...myCombatStatuses,
  ].map<SourceInfo>(({ obj, kind }) => {
    return {
      id: obj.id,
      name: obj.zhName,
      description: obj.zhDescription,
      code: `const ${pascalCase(obj.name)} = ${kind}(${obj.id})
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
  const card = cards.find(
    (c) =>
      c.tags.includes("GCG_TAG_TALENT") && Math.floor(c.id / 10) === 20000 + id,
  );
  if (!card) {
    return [];
  }
  return [
    {
      id: card.id,
      name: card.zhName,
      description: card.zhDescription,
      code: getCardCode(
        card,
        `, "character"`,
        `\n  .talentOf(${pascalCase(name)})`,
      ),
    },
  ];
}

export async function generateCharacters() {
  const result: Promise<void>[] = [];
  for (const ch of characters) {
    const filename =
      "characters/" +
      ch.tags[0].split("_").pop().toLowerCase() +
      "/" +
      snakeCase(ch.name) +
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
    const skills: any[] = ch.skills;

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
          name: sk.zhName,
          description: sk.zhDescription,
          code: `const ${pascalCase(sk.name)} = skill(${sk.id})
  .type("${TYPE_MAP[sk.typetag]}")${getCostCode(sk.playcost)}
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
      name: ch.zhName,
      description: ch.zhDescription,
      code: `const ${pascalCase(ch.name)} = character(${ch.id})
  .tags(${tagCode})
  .skills(${skills.map((sk) => pascalCase(sk.name)).join(", ")})
  .done();`,
    });
    items.push(...getTalentCard(ch.id, ch.name));

    result.push(writeSourceCode(filename, initCode, items));
  }
  return Promise.all(result);
}
