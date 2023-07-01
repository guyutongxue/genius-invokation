import { ContextOfEvent, EventHandlers, PassiveSkillInfo } from "@gi-tcg/data";
import { Entity, shallowClone } from "./entity.js";

type PassiveSkillInfoWithId = Readonly<PassiveSkillInfo & { id: number }>;

export class PassiveSkill extends Entity {
  private handler: EventHandlers;
  private usagePerRound: number;

  constructor(private readonly info: PassiveSkillInfoWithId) {
    super(info.id);
    this.handler = new this.info.handlerCtor();
    this.usagePerRound = this.info.usagePerRound;
  }

  handleEvent<E extends keyof EventHandlers>(e: E, c: ContextOfEvent<E>) {
    if (e === "onActionPhase") {
      this.usagePerRound = this.info.usagePerRound;
    }
    if (this.usagePerRound > 0 && typeof this.handler[e] === "function") {
      // @ts-ignore
      const result = await this.handler[e](c);
      if (result !== false) {
        this.usagePerRound--;
      }
    }
  }

  clone() {
    const clone = shallowClone(this);
    clone.handler = shallowClone(this.handler);
    return clone;
  }
}
