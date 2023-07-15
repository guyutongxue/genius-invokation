import { CharacterInfoWithId, ElementTag, getCharacter, getSkill } from "@gi-tcg/data";
import { Entity, shallowClone } from "./entity.js";
import { Equipment } from "./equipment.js";
import { Status } from "./status.js";
import { Aura, CharacterData, DiceType } from "@gi-tcg/typings";
import { PassiveSkill } from "./passive_skill.js";
import { EventCreatorArgsForCharacter, EventFactory, EventHandlerNames1 } from "./context.js";
import { Skill } from "./skill.js";
import { Player } from "./player.js";

const ELEMENT_TAG_MAP: Record<ElementTag, DiceType> = {
  cryo: DiceType.Cryo,
  hydro: DiceType.Hydro,
  pyro: DiceType.Pyro,
  electro: DiceType.Electro,
  anemo: DiceType.Anemo,
  geo: DiceType.Geo,
  dendro: DiceType.Dendro,
};

export class Character extends Entity {
  public readonly info: CharacterInfoWithId;
  public health: number;
  private defeated = false;
  public energy: number = 0;
  public equipments: Equipment[] = [];
  public statuses: Status[] = [];
  public applied: Aura = Aura.None;
  public skills: Skill[] = [];
  public passiveSkills: PassiveSkill[] = [];

  constructor(id: number, private parent: Player) {
    super(id);
    this.info = getCharacter(id);
    this.health = this.info.maxHealth;
    for (const s of this.info.skills) {
      const skill = getSkill(s);
      if (skill.type === "passive") {
        this.passiveSkills.push(new PassiveSkill(skill));
      } else {
        this.skills.push(new Skill(skill));
      }
    }
  }
  private sendEvent<K extends EventHandlerNames1>(event: K, ...args: EventCreatorArgsForCharacter<K>) {
    this.parent.sendEventFromCharacter(this, event, ...args);
  }

  revive() {
    this.defeated = false;
    this.health = 0;
    this.sendEvent("onEnter");
  }

  isAlive() {
    return !this.defeated;
  }
  fullEnergy() {
    return this.energy === this.info.maxEnergy;
  }
  elementType(): DiceType {
    const elementTag = this.info.tags.filter((t): t is ElementTag =>
      Object.keys(ELEMENT_TAG_MAP).includes(t)
    );
    if (elementTag.length === 0) return DiceType.Void;
    const elementType = ELEMENT_TAG_MAP[elementTag[0]] ?? DiceType.Void;
    return elementType;
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
    clone.skills = this.skills.map(s => s.clone());
    clone.passiveSkills = this.passiveSkills.map(h => h.clone());
    return clone;
  }
};
