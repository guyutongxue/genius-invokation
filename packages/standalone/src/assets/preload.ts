import { ref } from "vue";
import icons from "./icons.json";
import images from "./images.json";

async function preloadImage(url: string) {
  await new Promise((resolve, reject) => {
    const image = new Image();
    image.src = url;
    image.onload = resolve;
    image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
  });
  progress.value += 1;
}

export const progress = ref(0);
export const total = Object.keys(icons).length + Object.keys(images).length;

export async function preloadAllImages() {
  const iconUrls = [...new Set(Object.values(icons))].map(name => "https://guyutongxue.site/gcg-buff-icon-data/Sprite/" + name);
  const imageUrls = [...new Set(Object.values(images))];
  return await Promise.all([...iconUrls, ...imageUrls].map(preloadImage));
}
