import { readdir, writeFile, rm, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Sharp from "sharp";

import { characters, cards, summons } from "../prescan";
// generated from get_skill_images.ts
import skillImages from "./skill.json";
// generated from https://github.com/Guyutongxue/gcg-buff-icon-data
import statusImages from "./status.json";

const dirname = path.join(fileURLToPath(import.meta.url), "..");

const filenameMap = new Map<string, string>([
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

const imagePath = path.join(dirname, "../../images/Sprite");

if (!existsSync(imagePath)) {
  throw new Error(
    `Image path does not exist: ${imagePath}\nFollow instructions in README.md to extract images`,
  );
}

const TARGET_PATH = path.join(dirname, "../../../standalone/public/assets");
if (existsSync(TARGET_PATH)) {
  await rm(TARGET_PATH, { recursive: true, force: true });
}
await mkdir(TARGET_PATH);

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
  await img.toFile(path.join(TARGET_PATH, `${v}.webp`));
  done.add(v);
}

await writeFile(
  path.join(TARGET_PATH, "index.json"),
  JSON.stringify(Object.fromEntries(filenameMap), void 0, 2),
);
