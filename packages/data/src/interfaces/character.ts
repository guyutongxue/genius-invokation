import { DamageType } from "@jenshin-tcg/typings";

export type CharacterTag = "anemo" | "geo" | "electro" | "dendro" | "hydro" | "pyro" | "cryo" | "sword" | "bow" | "claymore" | "pole" | "catalyst" | "mondstadt" | "liyue" | "inazuma" | "sumeru" | "fatui" | "monster" | "hilichurl";

export interface CharacterInfo {
  readonly objectId: number;
  readonly health: number;
  readonly energy: number;
  tags: CharacterTag[];
}

export interface ICharacter {
  getInfo(): CharacterInfo;
  getHealth(): number;
  getEnergy(): number;

  
}
