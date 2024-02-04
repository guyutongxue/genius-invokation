import { readdir, writeFile, rm, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import Sharp from "sharp";


import { characters, cards, summons } from "../prescan";
// generated from get_skill_images.ts
import skillImages from "./skill.json";
// generated from https://github.com/Guyutongxue/gcg-buff-icon-data
import statusImages from "./status.json";

const { values: { inputPath, outputPath } } = parseArgs({
  args: process.argv.slice(2),
  options: {
    inputPath: {
      type: "string",
      short: "i",
    },
    outputPath: {
      type: "string",
      short: "o",
    }
  }
})
if (!inputPath) {
  throw new Error("Missing input");
}
if (!outputPath) {
  throw new Error("Missing output");
}

const filenameMap = new Map<string, string>([
  ["0", "UI_Gcg_Buff_Common_Element_Physics"],
  ["1", "UI_Gcg_Buff_Common_Element_Ice"],
  ["2", "UI_Gcg_Buff_Common_Element_Water"],
  ["3", "UI_Gcg_Buff_Common_Element_Fire"],
  ["4", "UI_Gcg_Buff_Common_Element_Electric"],
  ["5", "UI_Gcg_Buff_Common_Element_Wind"],
  ["6", "UI_Gcg_Buff_Common_Element_Rock"],
  ["7", "UI_Gcg_Buff_Common_Element_Grass"],
  ["9", "UI_Gcg_Buff_Common_Element_Heal"],
  ...Object.entries(skillImages),
  ...Object.entries(statusImages),
]);

for (const obj of [...characters, ...cards, ...summons]) {
  if (filenameMap.has(obj.id)) {
    console.warn(`Duplicate ID: ${obj.id}`);
  }
  let cardImageFilename = obj.image.filename_cardface;
  // Some fix
  if (cardImageFilename === "UI_Gcg_CardFace_Summon_AbyssEle") {
    cardImageFilename = "UI_Gcg_CardFace_Summon_AbyssEle_Layer00";
  }
  filenameMap.set(String(obj.id), cardImageFilename);
}

const imagePath = path.join(inputPath, "./Sprite");

if (!existsSync(imagePath)) {
  throw new Error(
    `Image path does not exist: ${imagePath}\nFollow instructions in README.md to extract images`,
  );
}

if (!existsSync(outputPath)) {
  await mkdir(outputPath);
}

const files = await readdir(imagePath);
const done = new Set<string>();

for (const [, v] of filenameMap) {
  const filename = `${v}.png`;
  if (!files.includes(filename)) {
    throw new Error(`Missing image: ${filename}`);
  }
  if (done.has(v)) {
    continue;
  }

  const candidates = [filename];
  const filenameRegex = new RegExp(`^${v}#\\d+.png$`);
  candidates.push(...files.filter((f) => filenameRegex.test(f)));
  const stats = await Promise.all(
    candidates.map(
      async (p) => [p, await stat(path.join(imagePath, p))] as const,
    ),
  );
  stats.sort((a, b) => b[1].size - a[1].size);

  const srcFilepath = path.join(imagePath, stats[0][0]);
  const img = Sharp(srcFilepath);
  console.log(`Resizing ${filename}`);
  const { width, height } = await img.metadata();
  if (
    v.startsWith("Skill") ||
    v.startsWith("MonsterSkill")
  ) {
    if (width! > height!) {
      img.resize(30, null);
    } else {
      img.resize(null, 30);
    }
  } else if (v.startsWith("UI_Gcg_CardFace")) {
    img.resize(80, null);
  } else {
    img.resize(null, 20);
  }
  await img.toFile(path.join(outputPath, `${v}.webp`));
  done.add(v);
}

await writeFile(
  path.join(outputPath, "index.json"),
  JSON.stringify(Object.fromEntries(filenameMap), void 0, 2),
);
