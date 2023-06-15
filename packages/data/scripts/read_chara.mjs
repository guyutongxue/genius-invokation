//
// 从 @genshin-db/tcg 下载得到的 data.min.json 生成文件模板

import { readFile, writeFile } from "node:fs/promises";

const json = await readFile("./data.min.json", "utf-8");

const data = JSON.parse(json);

const en = data["data"]["English"];
const zh = data["data"]["ChineseSimplified"];

// await writeFile("./data.json", JSON.stringify( undefined, 2));

function nameToCamel(original, upper) {
  original = original.replace(/[^a-zA-Z]/g, " ");
  const [first, ...rest] = original.split(" ").filter((s) => s);
  return `${
    upper ? first[0].toUpperCase() + first.slice(1) : first.toLowerCase()
  }${rest.map((s) => s[0].toUpperCase() + s.slice(1)).join("")}`;
}

// const typeMap = {
//   GCG_SKILL_TAG_A: "Normal",
//   GCG_SKILL_TAG_E: "Skill",
//   GCG_SKILL_TAG_Q: "Burst",
//   GCG_SKILL_TAG_PASSIVE: "Passive",
// };
// function costMap(/** @type {string} */ s) {
//   if (s === "GCG_COST_ENERGY") return "Energy";
//   return s[14] + s.substring(15).toLowerCase();
// }

// const chara = Object.values(en.tcgcharactercards);
// const zhChara = Object.values(zh.tcgcharactercards);
// for (let i = 0; i < chara.length; i++) {
//   const c = chara[i];
//   const code = `
// import {
//   Context,
//   Character,
//   Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
//   Normal, Skill, Burst,
//   register,
// } from "@jenshin-tcg";

// @Character({
//   objectId: ${c.id},
//   health: ${c.hp},
//   energy: ${c.maxenergy},
//   tags: [${c.tags.map((t) => `"${t.split("_").pop().toLowerCase()}"`).join(", ")}],
// })
// class ${nameToCamel(c.name, true)} {
//   ${c.skills
//     .map(
//       (s, j) => `
//   @${typeMap[s.typetag]}
//   ${s.playcost.map((c) => `@${costMap(c.costtype)}(${c.count})`).join("\n  ")}
//   ${nameToCamel(s.name)}(c: Context) {
//     // ${zhChara[i].skills[j].descriptionreplaced}
//   }`
//     )
//     .join("\n  ")}
// }

// register(${nameToCamel(c.name, true)});
// `;
//   const filename = c.name
//     .replace(/\s+/, "_")
//     .replace(/[^_a-zA-Z]/g, "")
//     .toLowerCase();
//   await writeFile("test/" + filename + ".ts", code, "utf-8");
//   // break;
// }



const images = data["image"];
const result = {};
for (const [key, value] of Object.entries(zh.tcgactioncards/* tcgcharactercards */)) {
  const id = value.id;
  const image = images.tcgactioncards/* tcgcharactercards */[key]["filename_cardface"];
  result[id] = `https://api.ambr.top/assets/UI/gcg/${image}.png`;
}
await writeFile("./images2.json", JSON.stringify(result, undefined, 2));

