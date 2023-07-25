import { PassiveSkillInfo, SkillDescriptionContext, SkillInfo } from "@gi-tcg/data";
import { Entity, shallowClone } from "./entity.js";

export class Skill extends Entity {
  constructor(public readonly info: Exclude<SkillInfo, PassiveSkillInfo>) {
    super(info.id);
  }

  clone() {
    const clone = shallowClone(this);
    return clone;
  }

  async do(ctx: SkillDescriptionContext) {
    return this.info.action(ctx);
  }
}
