import { Aura, CharacterFacade, DamageType } from "@jenshin-tcg/typings";
import type { CharacterData } from "@jenshin-tcg/data";

export class Character {
  health: number;
  energy: number;
  weapon?: number;
  artifact?: number;
  equipments: number[] = [];
  statuses = [];
  applied = Aura.NONE;

  constructor(
    readonly id: number,
    readonly data: CharacterData
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
      statuses: this.statuses,
      applied: this.applied,
    };
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
