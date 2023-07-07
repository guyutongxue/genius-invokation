import { ContextOfEvent, EventHandlers, PassiveSkillInfo } from "@gi-tcg/data";
import { Entity, shallowClone } from "./entity.js";
import { ContextFactory } from "./context.js";

type PassiveSkillInfoWithId = Readonly<PassiveSkillInfo & { id: number }>;

export class PassiveSkill extends Entity {
  private handler: EventHandlers;
  private usagePerRound: number;

  constructor(private readonly info: PassiveSkillInfoWithId) {
    super(info.id);
    this.handler = new this.info.handlerCtor();
    this.usagePerRound = this.info.usagePerRound;
  }

  async handleEvent<E extends keyof EventHandlers>(
    e: E,
    cf: ContextFactory<ContextOfEvent<E>>
  ) {
    if (e === "onRollPhase") {
      this.usagePerRound = this.info.usagePerRound;
    }
    const ctx = cf(this.entityId);
    if (ctx && this.usagePerRound > 0) {
      const result = await Entity.handleEvent(this.handler, e, ctx);
      if (result) {
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
