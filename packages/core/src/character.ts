import { CharacterInfoWithId, ContextOfEvent, EventHandlers, getCharacter, getSkill } from "@gi-tcg/data";
import { Entity, shallowClone } from "./entity.js";
import { Equipment } from "./equipment.js";
import { Status } from "./status.js";
import { Aura, CharacterData, DiceType } from "@gi-tcg/typings";
import { PassiveSkill } from "./passive_skill.js";
import { ContextFactory } from "./context.js";

export class Character extends Entity {
  public readonly info: CharacterInfoWithId;
  public health: number;
  private defeated = false;
  public energy: number = 0;
  public equipments: Equipment[] = [];
  public statuses: Status[] = [];
  public applied: Aura = Aura.None;
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

  isAlive() {
    return !this.defeated;
  }
  fullEnergy() {
    return this.energy === this.info.maxEnergy;
  }
  
  handleEvent<E extends keyof EventHandlers>(
    event: E,
    cf: ContextFactory<ContextOfEvent<E>>
  ) {
    for (const sk of this.passiveSkills) {
      sk.handleEvent(event, cf);
    }
    for (const eq of this.equipments) {
      eq.handleEvent(event, cf);
    }
    for (const st of this.statuses) {
      st.handleEvent(event, cf);
    }
  }

  getData(): CharacterData {
    const weapon = this.equipments.find(e => e.isWeapon());
    const artifact = this.equipments.find(e => e.isArtifact());
    return {
      id: this.id,
      entityId: this.entityId,
      defeated: this.defeated,
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
