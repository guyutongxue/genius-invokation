import { DynamicTexture, Scene } from "@babylonjs/core";

const ASSETS_URL = "https://gi-tcg-assets.guyutongxue.site/api/v2/images";

const imageCache = new Map<number, HTMLImageElement>();

const loadImage = async (id: number): Promise<HTMLImageElement> => {
  const cached = imageCache.get(id);
  if (cached) {
    return Promise.resolve(cached);
  }

  const image = new Image();
  const { promise, resolve, reject } = Promise.withResolvers();
  image.onload = () => {
    imageCache.set(id, image);
    resolve();
  };
  image.onerror = reject;
  image.crossOrigin = "anonymous";
  image.src = `${ASSETS_URL}/${id}`;
  await promise;
  return image;
};

const ACTION_CARD_WIDTH = 420;
const ACTION_CARD_HEIGHT = 720;

const loadedActionCardTextures = new Map<number, DynamicTexture>();

export async function getActionCardTexture(scene: Scene, id: number) {
  const loaded = loadedActionCardTextures.get(id);
  if (loaded) {
    return loaded;
  }

  const image = await loadImage(id);
  const width = ACTION_CARD_WIDTH;
  const height = ACTION_CARD_HEIGHT;

  const texture = new DynamicTexture(
    `texture_card_${id}`,
    { width, height },
    scene,
    true,
  );
  texture.level = 1.6;

  const ctx = texture.getContext();
  
  ctx.drawImage(image, 0, 0, width, height);

  // 描边宽度
  const W = 10;
  // 圆角半径
  const R = 30;

  ctx.strokeStyle = "#765f33";
  ctx.lineWidth = W;

  ctx.beginPath();
  ctx.moveTo(width - R - W / 2, W / 2);
  ctx.arc(width - R - W / 2, R + W / 2, R, -Math.PI / 2, 0);
  ctx.lineTo(width - W / 2, height - R - W / 2);
  ctx.arc(width - R - W / 2, height - R - W / 2, R, 0, Math.PI / 2);
  ctx.lineTo(R + W / 2, height - W / 2);
  ctx.arc(R + W / 2, height - R - W / 2, R, Math.PI / 2, Math.PI);
  ctx.lineTo(W / 2, R + W / 2);
  ctx.arc(R + W / 2, R + W / 2, R, -Math.PI, -Math.PI / 2);
  ctx.closePath();
  ctx.stroke();
  // ctx.strokeRect(0, 0, width, height);

  texture.update();
  loadedActionCardTextures.set(id, texture);
  return texture;
}
