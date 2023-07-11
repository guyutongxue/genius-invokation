import { EventHandlers, PassiveSkillInfo } from "@gi-tcg/data";
import { Entity, shallowClone } from "./entity.js";
import { EventAndContext, EventFactory } from "./context.js";

type PassiveSkillInfoWithId = Readonly<PassiveSkillInfo & { id: number }>;

export class PassiveSkill extends Entity {
  private handler: EventHandlers;
  private usagePerRound: number;

  constructor(private readonly info: PassiveSkillInfoWithId) {
    super(info.id);
    this.handler = new this.info.handlerCtor();
    this.usagePerRound = this.info.usagePerRound;
  }

  async handleEvent(event: EventAndContext | EventFactory) {
    if (Array.isArray(event) && event[0] === "onRollPhase") {
      this.usagePerRound = this.info.usagePerRound;
    }
    const result = await this.doHandleEvent(this.handler, event);
    if (result) {
      this.usagePerRound--;
    }
  }

  clone() {
    const clone = shallowClone(this);
    clone.handler = shallowClone(this.handler);
    return clone;
  }
}
