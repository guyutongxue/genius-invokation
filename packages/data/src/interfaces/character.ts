import { DamageType } from "@jenshin-tcg/typings";
import { IStatus } from "..";
import { Context } from "../contexts";

export type CharacterTag = "anemo" | "geo" | "electro" | "dendro" | "hydro" | "pyro" | "cryo" | "sword" | "bow" | "claymore" | "pole" | "catalyst" | "mondstadt" | "liyue" | "inazuma" | "sumeru" | "fatui" | "monster" | "hilichurl";

export interface CharacterInfo {
  readonly objectId: number;
  readonly health: number;
  readonly energy: number;
  tags: CharacterTag[];
}

export interface ICharacter {
  toTarget(): number;

  getInfo(): CharacterInfo;
  getHealth(): number;
  getEnergy(): number;

  hasStatus(status: new (...args: unknown[]) => IStatus): boolean;
  isActive(): boolean;
}

export interface PassiveSkill {
  onBattleBegin?(c: Context): void;
}
