import {
  CharacterInfo,
  ElementTag,
  SkillInfo,
  getCharacter,
  getSkill,
} from "@gi-tcg/data";
import { Entity, EntityPath, createEntity, getEntityData, refreshEntity } from "./entity.js";
import { Equipment } from "./equipment.js";
import { Status } from "./status.js";
import { Aura, CharacterData, DiceType } from "@gi-tcg/typings";
import { PassiveSkill } from "./passive_skill.js";
import {
  EventCreatorArgsForCharacter,
  EventFactory,
  EventHandlerNames1,
} from "./context.js";
import { Skill } from "./skill.js";
import { PlayerMutator } from "./player.js";
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
  entityId: number;
  indexHint: number;
}

export type CharacterUpdateFn = (draft: Draft<CharacterState>, path: CharacterPath) => void;

export class Character extends Entity {

  revive() {
    this.defeated = false;
    this.health = 0;
    this.emitEvent("onRevive");
  }

  gainEnergy(energy = 1): number {
    const oldEnergy = this.energy;
    this.energy = Math.min(this.energy + energy, this.info.maxEnergy);
    return this.energy - oldEnergy;
  }

  createStatus(newStatusId: number) {
    const oldStatus = this.statuses.find((s) => s.info.id === newStatusId);
    if (oldStatus) {
      oldStatus.refresh();
      return oldStatus;
    } else {
      const newStatus = new Status(newStatusId);
      this.statuses.push(newStatus);
      return newStatus;
    }
  }

  // async *handleEvent(event: EventFactory) {
  //   for (const sk of this.passiveSkills) {
  //     await sk.handleEvent(event);
  //     yield;
  //   }
  //   for (const eq of this.equipments) {
  //     await eq.handleEvent(event);
  //     yield;
  //   }
  //   for (const st of this.statuses) {
  //     await st.handleEvent(event);
  //     yield;
  //   }
  // }
  // handleEventSync(event: EventFactory) {
  //   for (const sk of this.passiveSkills) {
  //     sk.handleEventSync(event);
  //   }
  //   for (const eq of this.equipments) {
  //     eq.handleEventSync(event);
  //   }
  //   for (const st of this.statuses) {
  //     st.handleEventSync(event);
  //   }
  // }
}

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
    };
  }
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
