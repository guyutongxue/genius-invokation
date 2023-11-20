import { CharacterTag } from "../character";
import { getSkill, registerCharacter } from "../registry";
import {
  InitiativeSkillDefinition,
  SkillDefinition,
  TriggeredSkillDefinition,
} from "../skill";
import { CharacterHandle, SkillHandle } from "./type";

class CharacterBuilder {
  private readonly tags: CharacterTag[] = [];
  private _maxHealth = 10;
  private _maxEnergy = 3;
  private readonly skills: SkillDefinition[] = [];
  constructor(private readonly id: number) {}

  addTags(...tags: CharacterTag[]) {
    this.tags.push(...tags);
    return this;
  }

  addSkills(...skills: SkillHandle[]) {
    this.skills.push(...skills.map(getSkill));
    return this;
  }

  maxHealth(value: number) {
    this._maxHealth = value;
    return this;
  }
  maxEnergy(value: number) {
    this._maxEnergy = value;
    return this;
  }

  build(): CharacterHandle {
    registerCharacter({
      type: "character",
      id: this.id,
      tags: this.tags,
      constants: {
        maxHealth: this._maxHealth,
        maxEnergy: this._maxEnergy,
      },
      initiativeSkills: this.skills.filter(
        (sk): sk is InitiativeSkillDefinition => sk.triggerOn === null,
      ),
      skills: this.skills.filter(
        (sk): sk is TriggeredSkillDefinition => sk.triggerOn !== null,
      ),
    });
    return this.id as CharacterHandle;
  }
}
