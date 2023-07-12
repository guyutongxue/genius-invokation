import { EventHandlers, PassiveSkillInfo } from "@gi-tcg/data";
import { Entity, shallowClone } from "./entity.js";
import { EventFactory, TrivialEvent } from "./context.js";

type PassiveSkillInfoWithId = Readonly<PassiveSkillInfo & { id: number }>;

export class PassiveSkill extends Entity {
  private handler: EventHandlers;
  private usagePerRound: number;

  constructor(public readonly info: PassiveSkillInfoWithId) {
    super(info.id);
    this.handler = new this.info.handlerCtor();
    this.usagePerRound = this.info.usagePerRound;
  }

  async handleEvent(event: TrivialEvent | EventFactory)  {
    if (event === "onActionPhase") {
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
