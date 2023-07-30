import {
  CharacterInfo,
  ElementTag,
  SkillInfo,
  getEquipment,
  getSkill,
} from "@gi-tcg/data";
import { EntityPath, createEntity, getEntityData, refreshEntity } from "./entity.js";
import { CharacterData, DiceType } from "@gi-tcg/typings";
import { CharacterState } from "./store.js";
import { Draft } from "immer";

const ELEMENT_TAG_MAP: Record<ElementTag, DiceType> = {
  cryo: DiceType.Cryo,
  hydro: DiceType.Hydro,
  pyro: DiceType.Pyro,
  electro: DiceType.Electro,
  anemo: DiceType.Anemo,
  geo: DiceType.Geo,
  dendro: DiceType.Dendro,
};

export interface CharacterPath {
  who: 0 | 1;
  info: CharacterInfo;
  entityId: number;
  indexHint: number;
}

export type CharacterUpdateFn = (draft: Draft<CharacterState>, path: CharacterPath) => void;

export function createStatus(ch: Draft<CharacterState>, chPath: CharacterPath, statusId: number): EntityPath {
  const idx = ch.statuses.findIndex((s) => s.info.id === statusId);
  if (idx !== -1) {
    refreshEntity(ch.statuses[idx]);
    return {
      type: "status",
      who: chPath.who,
      character: chPath,
      entityId: ch.statuses[idx].entityId,
      indexHint: idx,
      info: ch.statuses[idx].info,
    };
  } else {
    const newIdx = ch.statuses.length;
    const newStatus = createEntity("status", statusId);
    ch.statuses.push(newStatus);
    return {
      type: "status",
      who: chPath.who,
      character: chPath,
      entityId: newStatus.entityId,
      indexHint: newIdx,
      info: newStatus.info,
    };
  }
}

export function createEquipment(ch: Draft<CharacterState>, chPath: CharacterPath, eqId: number): EntityPath {
  const newEntity = createEntity("equipment", eqId);
  const SPECIAL_TYPE = ["weapon", "artifact"] as const;
  for (const tag of SPECIAL_TYPE) {
    if (newEntity.info.type === tag) {
      const oldIdx = ch.equipments.findIndex(c => c.info.type === tag);
      if (oldIdx !== -1) {
        ch.equipments.slice(oldIdx, 1);
      }
    }
  }
  const oldIdx = ch.equipments.findIndex((e) => e.info.id === eqId);
  if (oldIdx !== -1) {
    ch.equipments.slice(oldIdx, 1);
  }
  const newIdx = ch.equipments.length;
  ch.equipments.push(newEntity);
  return {
    type: "equipment",
    who: chPath.who,
    character: chPath,
    entityId: newEntity.entityId,
    indexHint: newIdx,
    info: newEntity.info,
  };
}

export function revive(ch: Draft<CharacterState>) {
  ch.defeated = false;
  ch.health = 0;
  // emitEvent("onRevive");
}
export function gainEnergy(ch: Draft<CharacterState>, value = 1) {
  ch.energy = Math.min(ch.energy + value, ch.info.maxEnergy);
}
export function loseEnergy(ch: Draft<CharacterState>, value = 1) {
  ch.energy = Math.max(ch.energy - value, 0);
}

export function fullEnergy(ch: CharacterState) {
  return ch.energy === ch.info.maxEnergy;
}
export function getCharacterData(ch: CharacterState): CharacterData {
  const weapon = ch.equipments.find((e) => e.info.type === "weapon");
  const artifact = ch.equipments.find((e) => e.info.type === "artifact");
  return {
    id: ch.info.id,
    entityId: ch.entityId,
    defeated: ch.defeated,
    health: ch.health,
    energy: ch.energy,
    weapon: weapon?.info.id ?? null,
    artifact: artifact?.info.id ?? null,
    equipments: ch.equipments.map((e) => e.info.id),
    statuses: ch.statuses.map(getEntityData),
    applied: ch.aura,
  };
}

export function skillDisabled(ch: CharacterState): boolean {
  return ch.statuses.some((s) => s.info.tags.includes("disableSkill"));
}

export function characterSkills(ch: CharacterState): SkillInfo[] {
  return ch.info.skills
    .map(getSkill)
    .filter((s) => s.type !== "passive" && !s.hidden);
}

export function characterElementType(ch: CharacterState): DiceType {
  const elementTag = ch.info.tags.filter((t): t is ElementTag =>
    Object.keys(ELEMENT_TAG_MAP).includes(t)
  );
  if (elementTag.length === 0) return DiceType.Void;
  const elementType = ELEMENT_TAG_MAP[elementTag[0]] ?? DiceType.Void;
  return elementType;
}
