import { Aura } from "@gi-tcg/typings";
import { TriggeredSkillDefinition, InitiativeSkillDefinition } from "./skill";

export type ElementTag =
  | "cryo"
  | "hydro"
  | "pyro"
  | "electro"
  | "anemo"
  | "geo"
  | "dendro";

export type WeaponTag =
  | "sword"
  | "claymore"
  | "pole"
  | "catalyst"
  | "bow"
  | "other";

export type NationTag =
  | "mondstadt"
  | "liyue"
  | "inazuma"
  | "sumeru"
  | "monster"
  | "fatui"
  | "hilichurl";

export type CharacterTag = ElementTag | WeaponTag | NationTag;

export interface CharacterDefinition {
  readonly type: "character";
  readonly id: number;
  readonly tags: CharacterTag[];
  readonly constants: CharacterConstants;
  readonly initiativeSkills: InitiativeSkillDefinition[];
  readonly skills: TriggeredSkillDefinition[];
}

export interface CharacterVariables {
  readonly health: number;
  readonly energy: number;
  readonly aura: Aura;
  readonly [key: string]: number;
};

export interface CharacterConstants {
  readonly maxHealth: number;
  readonly maxEnergy: number;
  readonly [key: string]: number;
}
