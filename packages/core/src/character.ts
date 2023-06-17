import { Aura, CharacterFacade, DamageType } from "@jenshin-tcg/typings";
import type { CharacterData } from "@jenshin-tcg/data";
import { Status } from "./status";

export class Character {
  private health: number;
  private energy: number;
  private weapon?: number;
  private artifact?: number;
  private equipments: number[] = [];
  private statuses: Status[] = [];
  private applied = Aura.NONE;

  constructor(
    private readonly id: number,
    private readonly data: CharacterData
  ) {
    this.health = data.info.health;
    this.energy = 0;
  }

  toFacade(): CharacterFacade {
    return {
      id: this.id,
      objectId: this.data.info.objectId,
      health: this.health,
      energy: this.energy,
      weapon: this.weapon,
      artifact: this.artifact,
      equipments: this.equipments,
      statuses: this.statuses.map((c) => c.toFacade()),
      applied: this.applied,
    };
  }

  getSkills() {
    return this.data.skills;
  }

  getStatuses() {
    return this.statuses;
  }

  // heal(value: number) {
  //   return this.damage(value, DamageType.HEAL);
  // }
  // damage(value: number, type: DamageType) {
  //   if (type === DamageType.HEAL) {
  //     const newHealth = Math.max(this.data.info.health, this.health + value);
  //     // TODO: FUCK
  //     this.health = newHealth;
  //   } else {
  //     // TODO: FUCK
  //     this.health -= value;
  //     // ELEMENTAL blahblah
  //   }
  // }
}
