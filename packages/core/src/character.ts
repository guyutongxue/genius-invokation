import { Aura, CharacterFacade, DamageType } from "@jenshin-tcg/typings";
import { CharacterInfo } from "./context";

export class Character implements CharacterFacade {
  health: number;
  energy: number;
  weapon?: number;
  artifact?: number;
  equipments: number[] = [];
  statuses = [];
  applied = Aura.NONE;

  constructor(public id: number, private readonly info: CharacterInfo) {
    this.health = info.health;
    this.energy = 0;
  }

  toFacade(): CharacterFacade {
    return {
      id: this.id,
      health: this.health,
      energy: this.energy,
      weapon: this.weapon,
      artifact: this.artifact,
      equipments: this.equipments,
      statuses: this.statuses,
      applied: this.applied,
    };
  }

  heal(value: number) {
    return this.damage(value, DamageType.HEAL);
  }
  damage(value: number, type: DamageType) {
    if (type === DamageType.HEAL) {
      const newHealth = Math.max(this.info.health, this.health + value);
      // TODO: FUCK
      this.health = newHealth;
    } else {
      // TODO: FUCK
      this.health -= value;
      // ELEMENTAL blahblah
    }
  }
}
