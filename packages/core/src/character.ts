import { Aura, CharacterFacade, DamageType, DiceType } from "@jenshin-tcg/typings";
import type { CharacterData, ICharacter } from "@jenshin-tcg/data";
import { Status } from "./status";

export class Character {
  readonly objectId: number;
  private health: number;
  private energy: number;
  private weapon?: number;
  private artifact?: number;
  private equipments: number[] = [];
  private statuses: Status[] = [];
  private applied = Aura.NONE;

  constructor(
    readonly id: number,
    private readonly data: CharacterData
  ) {
    this.objectId = data.info.objectId;
    this.health = data.info.health;
    this.energy = 0;
  }

  toFacade(): CharacterFacade {
    return {
      id: this.id,
      objectId: this.objectId,
      health: this.health,
      energy: this.energy,
      weapon: this.weapon,
      artifact: this.artifact,
      equipments: this.equipments,
      statuses: this.statuses.map((c) => c.toFacade()),
      applied: this.applied,
    };
  }

  toContext(): ICharacter {
    return {
      toTarget: () => 0, // TODO
      getInfo: () => this.data.info,
      getHealth: () => this.health,
      getEnergy: () => this.energy,
      hasStatus: (status: Function) => false, // TODO
      isActive: () => false, // TODO
    }
  }

  getSkills() {
    return this.data.skills;
  }

  getStatuses() {
    return this.statuses;
  }

  alive() {
    return this.health > 0;
  }

  elementType(): DiceType {
    return Math.floor((this.objectId % 1000) / 100) as DiceType;
  }
}
