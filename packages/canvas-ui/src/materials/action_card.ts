import { Scene, StandardMaterial } from "@babylonjs/core";
import { getActionCardTexture } from "../textures/action_card";

const loadedActionCardMaterials = new Map<number, StandardMaterial>();

export async function getActionCardMaterial(scene: Scene, id: number) {
  const loaded = loadedActionCardMaterials.get(id);
  if (loaded) {
    return loaded;
  }

  const material = new StandardMaterial(`material_card_${id}`, scene);
  material.specularPower = 0;
  material.specularColor.set(0, 0, 0);
  material.useAlphaFromDiffuseTexture = true;
  material.diffuseTexture = await getActionCardTexture(scene, id);
  
  // mat.disableLighting = true;
  // mat.emissiveTexture = dynTexture;
  // mat.emissiveTexture.hasAlpha = true;
  // mat.opacityTexture = dynTexture;

  loadedActionCardMaterials.set(id, material);
  return material;
}
