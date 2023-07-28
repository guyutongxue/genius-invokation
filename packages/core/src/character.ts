import {
  CharacterInfo,
  ElementTag,
  SkillInfo,
  getCharacter,
  getSkill,
} from "@gi-tcg/data";
import { Entity, getEntityData } from "./entity.js";
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

export class Character extends Entity {

  private emitEvent<K extends EventHandlerNames1>(
    event: K,
    ...args: EventCreatorArgsForCharacter<K>
  ) {
    this.parent.emitEventFromCharacter(this, event, ...args);
  }

  revive() {
    this.defeated = false;
    this.health = 0;
    this.emitEvent("onRevive");
  }

  isAlive() {
    return !this.defeated;
  }
  gainEnergy(energy = 1): number {
    const oldEnergy = this.energy;
    this.energy = Math.min(this.energy + energy, this.info.maxEnergy);
    return this.energy - oldEnergy;
  }
  fullEnergy() {
    return this.energy === this.info.maxEnergy;
  }

  // elementType(): DiceType {}

  skillDisabled() {
    return this.statuses.some((s) => s.info.tags.includes("disableSkill"));
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

  async *handleEvent(event: EventFactory) {
    for (const sk of this.passiveSkills) {
      await sk.handleEvent(event);
      yield;
    }
    for (const eq of this.equipments) {
      await eq.handleEvent(event);
      yield;
    }
    for (const st of this.statuses) {
      await st.handleEvent(event);
      yield;
    }
  }
  handleEventSync(event: EventFactory) {
    for (const sk of this.passiveSkills) {
      sk.handleEventSync(event);
    }
    for (const eq of this.equipments) {
      eq.handleEventSync(event);
    }
    for (const st of this.statuses) {
      st.handleEventSync(event);
    }
  }
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
