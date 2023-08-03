import { Aura, DiceType } from "@gi-tcg/typings";
import { EquipmentHandle, StatusHandle } from "./builders";
import { StatusContext } from "./statuses";
import { EquipmentContext, EquipmentInfo, EquipmentType } from "./equipments";

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

type CharacterInfoNoId = Omit<CharacterInfo, "id">;

export interface CharacterInfo {
  readonly id: number;
  readonly tags: CharacterTag[];
  readonly maxHealth: number;
  readonly maxEnergy: number;
  readonly skills: number[];
}

interface CharacterBaseContext<Writable extends boolean = false> {
  readonly entityId: number;
  readonly info: CharacterInfo;

  readonly health: number;
  readonly energy: number;
  readonly aura: Aura;
  isAlive(): boolean;
  isMine(): boolean;
  skillDisabled(): boolean;

  findEquipment(equipment: EquipmentHandle | "artifact" | "weapon"): EquipmentContext<Writable> | null;
  findStatus(status: StatusHandle): StatusContext<Writable> | null;
  findShield(): StatusContext<Writable> | null;

  isActive(): boolean;
  isMine(): boolean;

  asTarget(): `#${number}`;
  elementType(): DiceType;
}

interface CharacterActionContext extends CharacterBaseContext<true> {
  equip(equipment: EquipmentHandle): void;
  removeEquipment(equipment: EquipmentHandle): void;

  heal(value: number): void;
  gainEnergy(amount: number): number;
  loseEnergy(amount: number): number;

  createStatus(status: StatusHandle): StatusContext<true>;
  removeStatus(status: StatusHandle): boolean;
}

export type CharacterContext<Writable extends boolean = false> = Writable extends true ? CharacterActionContext : CharacterBaseContext;

const allCharacters = new Map<number, CharacterInfo>();
export function registerCharacter(id: number, info: CharacterInfoNoId) {
  if (allCharacters.has(id)) {
    throw new Error(`Character ${id} already registered`);
  }
  allCharacters.set(id, { id, ...info });
}
export function getCharacter(id: number) {
  if (!allCharacters.has(id)) {
    throw new Error(`Character ${id} not found`);
  }
  return allCharacters.get(id)!;
}
