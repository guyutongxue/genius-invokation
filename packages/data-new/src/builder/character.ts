import { CharacterTag } from "../character";
import { getSkill, registerCharacter } from "../registry";
import {
  InitiativeSkillDefinition,
  TriggeredSkillDefinition,
} from "../skill";
import { CharacterHandle, SkillHandle } from "./type";

class CharacterBuilder {
  private readonly tags: CharacterTag[] = [];
  private _maxHealth = 10;
  private _maxEnergy = 3;
  private readonly initiativeSkills: InitiativeSkillDefinition[] = [];
  private readonly skills: TriggeredSkillDefinition[] = [];
  constructor(private readonly id: number) {}

  addTags(...tags: CharacterTag[]) {
    this.tags.push(...tags);
    return this;
  }

  addSkills(...skills: SkillHandle[]) {
    for (const sk of skills) {
      const def = getSkill(sk);
      if (def.triggerOn === null) {
        this.initiativeSkills.push(def);
      } else {
        this.skills.push(def);
      }
    }
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
      initiativeSkills: this.initiativeSkills,
      skills: this.skills,
    });
    return this.id as CharacterHandle;
  }
}

export function character(id: number) {
  return new CharacterBuilder(id);
}
