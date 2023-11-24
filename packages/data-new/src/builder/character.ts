import { Aura } from "@gi-tcg/typings";
import { CharacterTag } from "../base/character";
import { getSkillDefinition, registerCharacter } from "../registry";
import {
  InitiativeSkillDefinition,
  TriggeredSkillDefinition,
} from "../base/skill";
import { CharacterHandle, SkillHandle } from "./type";

class CharacterBuilder {
  private readonly _tags: CharacterTag[] = [];
  private _maxHealth = 10;
  private _maxEnergy = 3;
  private readonly _initiativeSkills: InitiativeSkillDefinition[] = [];
  private readonly _skills: TriggeredSkillDefinition[] = [];
  constructor(private readonly id: number) {}

  tags(...tags: CharacterTag[]) {
    this._tags.push(...tags);
    return this;
  }

  skills(...skills: SkillHandle[]) {
    for (const sk of skills) {
      const def = getSkillDefinition(sk);
      if (def.triggerOn === null) {
        this._initiativeSkills.push(def as InitiativeSkillDefinition);
      } else {
        this._skills.push(def);
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

  done(): CharacterHandle {
    registerCharacter({
      type: "character",
      id: this.id,
      tags: this._tags,
      constants: {
        health: this._maxHealth,
        energy: 0,
        aura: Aura.None,
        maxHealth: this._maxHealth,
        maxEnergy: this._maxEnergy,
      },
      initiativeSkills: this._initiativeSkills,
      skills: this._skills,
    });
    return this.id as CharacterHandle;
  }
}

export function character(id: number) {
  return new CharacterBuilder(id);
}
