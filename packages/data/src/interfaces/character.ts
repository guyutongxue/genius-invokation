import { DamageType } from "@jenshin-tcg/typings";

export interface CharacterInfo {
  readonly objectId: number;
  readonly health: number;
  readonly energy: number;
  tags?: unknown[];
}

export interface ICharacter {
  getInfo(): CharacterInfo;
  getHealth(): number;
  getEnergy(): number;

  
}
