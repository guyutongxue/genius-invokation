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
  readonly tags: readonly CharacterTag[];
  readonly constants: CharacterConstants;
  readonly initiativeSkills: readonly InitiativeSkillDefinition[];
  readonly skills: readonly TriggeredSkillDefinition[];
}

export interface CharacterVariables {
  readonly health: number;
  readonly energy: number;
  readonly aura: Aura;
  readonly alive: 0 | 1;
  readonly [key: string]: number;
};

export interface CharacterConstants extends CharacterVariables {
  readonly maxHealth: number;
  readonly maxEnergy: number;
}
