import { SkillInfoWithId } from "@gi-tcg/data";
import { Entity, shallowClone } from "./entity.js";

export class Skill extends Entity {
  constructor(public readonly info: SkillInfoWithId) {
    super(info.id);
  }

  clone() {
    const clone = shallowClone(this);
    return clone;
  }
}
