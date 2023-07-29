import { PassiveSkillInfo, SkillInfo } from "@gi-tcg/data";
import { Entity } from "./entity.js";

export class Skill extends Entity {
  constructor(public readonly info: Exclude<SkillInfo, PassiveSkillInfo>) {
    super(info.id);
  }

  async do(ctx: SkillDescriptionContext) {
    return this.info.action(ctx);
  }
}
