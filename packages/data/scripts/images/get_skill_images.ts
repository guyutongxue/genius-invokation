// Use ambr.top API to get skill images

import { characters } from "../prescan";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeFile } from "node:fs/promises";

const skillImageMap = new Map<number, string>([
  [24012, "MonsterSkill_S_EffigyElectric_01"],
  [24013, "MonsterSkill_E_EffigyElectric_01_HD"],
  [24014, "MonsterSkill_S_EffigyElectric_04"],
  [63011, "Skill_A_Catalyst_MD"],
  [63012, "MonsterSkill_S_LaSignoraHarbinger_01"],
  [63013, "MonsterSkill_E_LaSignoraHarbinger_01_HD"],
  [66013, "MonsterSkill_S_Dahaka_05"],
  [66023, "MonsterSkill_S_Dahaka_03"],
  [66033, "MonsterSkill_S_Dahaka_04"],
  [66043, "MonsterSkill_S_Dahaka_06"],
] as const);

for (const ch of characters) {
  const url = `https://api.ambr.top/v2/en/gcg/${ch.id}`;
  console.log(url);
  const { data, response } = await fetch(url, {
    // verbose: true,
    proxy: process.env.https_proxy,
  } as any).then((r) => r.json());
  if (response !== 200) {
    console.warn(`Failed to fetch ${ch.id}`);
    continue;
  }
  for (const [k, v] of Object.entries<any>(data.talent)) {
    if (v.icon === null) {
      if (!skillImageMap.has(Number(k))) {
        console.warn(`Missing skill image: ${k}`);
      }
      continue;
    }
    skillImageMap.set(Number(k), v.icon);
  }
}

console.log(skillImageMap);

await writeFile(
  path.join(fileURLToPath(import.meta.url), "../skill.json"),
  JSON.stringify(Object.fromEntries(skillImageMap), void 0, 2),
);
