import { Texture, Scene } from "@babylonjs/core";
import { DiceType } from "@gi-tcg/typings";

const DICE_COLORS = {
  [DiceType.Void]: "#4a4a4a",
  [DiceType.Electro]: "#b380ff",
  [DiceType.Pyro]: "#ff9955",
  [DiceType.Dendro]: "#a5c83b",
  [DiceType.Cryo]: "#55ddff",
  [DiceType.Geo]: "#ffcc00",
  [DiceType.Hydro]: "#3e99ff",
  [DiceType.Anemo]: "#80ffe6",
  [DiceType.Omni]: "#dcd4c2",
};

const getSvgSource = (color: string) => `<svg
  width="128"
  height="128"
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 15 15"
  style="color: ${color}; fill: currentColor;"
>
  <path
    d="M7.5 2.065L2.97 4.784v5.432l4.53 2.719 4.53-2.719V4.784z"
    stroke-width=".214"
    stroke-linejoin="round"
    fill="#FFF"
    stroke="gray"
  />
  <path
    d="M7.5 2.065L2.97 4.784v5.432l4.53 2.719 4.53-2.719V4.784z"
    opacity=".2"
  />
  <path
    d="M7.5 7.5V2.065L2.97 4.784zM7.5 12.935V7.5l4.53 2.716z"
    opacity=".6"
  />
  <path d="M2.97 4.784L7.5 7.5l-4.53 2.716z" opacity=".9" />
  <path d="M7.5 12.935V7.5l-4.53 2.716zm0-10.87V7.5l4.53-2.716z" />
  <path d="M7.5 7.5l4.53-2.716v5.432z" opacity=".9" />
</svg>`;

const loadedDiceTextures = new Map<DiceType, Texture>();

export async function preloadDiceTextures(scene: Scene) {
  await Promise.all(
    [...Object.entries(DICE_COLORS)].map(async ([type, color]) => {
      const svg = getSvgSource(color);
      const { promise, resolve, reject } = Promise.withResolvers<void>();
      // TODO: Load SVG as image into a DynamicTexture canvas context.
      // We need to use context draw stroked text.
      const texture = Texture.LoadFromDataString(`texture_dice_${type}`, `data:image/svg+xml;utf-8,${svg}`, scene);
      texture.level = 1.6;
      texture.hasAlpha = true;
      loadedDiceTextures.set(Number(type) as DiceType, texture);
      // never resolved. wondering why
      // await promise;
    }),
  );
}

export function getDiceTexture(type: DiceType) {
  return loadedDiceTextures.get(type)!;
}
