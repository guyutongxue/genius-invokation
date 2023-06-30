import { CharacterInfoWithId, getCharacter, getSkill } from "@gi-tcg/data";
import { Entity, shallowClone } from "./entity.js";
import { Equipment } from "./equipment.js";
import { Status } from "./status.js";
import { Aura, CharacterData } from "@gi-tcg/typings";
import { PassiveSkill } from "./passive_skill.js";

export class Character extends Entity {
  private readonly info: CharacterInfoWithId;
  private health: number;
  private energy: number = 0;
  private equipments: Equipment[] = [];
  private statuses: Status[] = [];
  private applied: Aura = Aura.None;
  private passiveSkills: PassiveSkill[] = [];

  constructor(id: number) {
    super(id);
    this.info = getCharacter(id);
    this.health = this.info.maxHealth;
    for (const s of this.info.skills) {
      const skill = getSkill(s);
      if (skill.type === "passive") {
        this.passiveSkills.push(new PassiveSkill(skill));
      }
    }
  }

  getData(): CharacterData {
    const weapon = this.equipments.find(e => e.isWeapon());
    const artifact = this.equipments.find(e => e.isArtifact());
    return {
      id: this.id,
      entityId: this.entityId,
      health: this.health,
      energy: this.energy,
      weapon: weapon?.getData() ?? null,
      artifact: artifact?.getData() ?? null,
      equipments: this.equipments.map(e => e.getData()),
      statuses: this.statuses.map(s => s.getData()),
      applied: this.applied
    };
  }

  clone() {
    const clone = shallowClone(this);
    clone.equipments = this.equipments.map(e => e.clone());
    clone.statuses = this.statuses.map(s => s.clone());
    clone.passiveSkills = this.passiveSkills.map(h => h.clone());
    return clone;
  }
};
