import { EventHandlers, PassiveSkillInfo } from "@gi-tcg/data";
import { Entity, shallowClone } from "./entity.js";

type PassiveSkillInfoWithId = Readonly<PassiveSkillInfo & { id: number }>;

export class PassiveSkill extends Entity {
  private handler: EventHandlers;

  constructor(private readonly info: PassiveSkillInfoWithId) {
    super(info.id);
    this.handler = new this.info.handlerCtor();
  }

  clone() {
    const clone = shallowClone(this);
    clone.handler = shallowClone(this.handler);
    return clone;
  }
}
