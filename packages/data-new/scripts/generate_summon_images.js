// @ts-check
import wiki from "wikijs";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import * as path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const w = await wiki({
  apiUrl: "https://genshin-impact.fandom.com/api.php"
});
const pages = await w.pagesInCategory("Category:Genius Invokation TCG Summons");

const result = {};

for (const page of pages) {
  console.log(`Processing ${page}`);
  const p = await w.page(page);
  result[page] = {
    ...await p.info(),
    imageLink: await p.mainImage()
  };
}

const images = {};
for (const info of Object.values(result)) {
  if (info.imageLink && info.id) {
    // static.wikia 不允许外链引用
    images[info.id] = info.imageLink.replace(/static\.wikia/g, "vignette.wikia");
  }
}

// 一些共用的图片
images["115012"] = images["115011"]; // 大型风灵
images["114012"] = images["114011"]; // 奥兹

await writeFile(path.join(__dirname, "./summons.json"), JSON.stringify(images, null, 2));
