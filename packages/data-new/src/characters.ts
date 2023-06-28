import { DiceType } from "@gi-tcg/typings";
import { EquipmentHandle, StatusHandle } from "./builders";
import { StatusContext } from "./statuses";
import { Target } from "./target";

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

interface CharacterInfo {
  tags: CharacterTag[];
  skills: number[];
}
export type CharacterInfoWithId = Readonly<CharacterInfo & { id: number }>;

export interface CharacterContext {
  readonly entityId: number;
  readonly info: CharacterInfoWithId;

  readonly health: number;
  readonly energy: number;
  hasEquipment(equipment: EquipmentHandle): boolean;
  equip(equipment: EquipmentHandle): void;
  hasStatus(status: StatusHandle): StatusContext | null;

  isActive(): boolean;
  isMine(): boolean;

  asTarget(): Target;
  elementType(): DiceType;
}
// return Target.ofCharacter(this.info.id);

const allCharacters = new Map<number, CharacterInfoWithId>();
export function registerCharacter(id: number, info: CharacterInfo) {
  allCharacters.set(id, { id, ...info });
}
export function getCharacter(id: number) {
  if (!allCharacters.has(id)) {
    throw new Error(`Character ${id} not found`);
  }
  return allCharacters.get(id)!;
}
