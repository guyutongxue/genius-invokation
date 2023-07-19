import { PassiveSkillInfo, SkillDescriptionContext, SkillInfoWithId } from "@gi-tcg/data";
import { Entity, shallowClone } from "./entity.js";

export class Skill extends Entity {
  constructor(public readonly info: Exclude<SkillInfoWithId, PassiveSkillInfo>) {
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
