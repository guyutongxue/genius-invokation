import {
  ContextOfEvent,
  EventHandlers,
  getSupport,
  SupportInfoWithId,
} from "@gi-tcg/data";
import { Entity, shallowClone } from "./entity.js";
import { SupportData } from "@gi-tcg/typings";
import { ContextFactory } from "./context.js";

export class Support extends Entity {
  private readonly info: SupportInfoWithId;
  private handler: EventHandlers;
  private usage: number;
  private usagePerRound: number;
  private duration: number;
  shouldDispose = false;

  constructor(id: number) {
    super(id);
    this.info = getSupport(id);
    this.handler = new this.info.handlerCtor();
    this.usage = this.info.usage;
    this.usagePerRound = this.info.usagePerRound;
    this.duration = this.info.duration;
  }

  getVisibleValue(): number | null {
    if (this.info.usage !== 1 && isFinite(this.usage)) {
      return this.usage;
    }
    if (this.info.duration !== 1 && isFinite(this.duration)) {
      return this.duration;
    }
    return null;
  }

  async handleEvent<E extends keyof EventHandlers>(
    e: E,
    cf: ContextFactory<ContextOfEvent<E>>
  ) {
    if (e === "onRollPhase") {
      this.usagePerRound = this.info.usagePerRound;
      this.duration--;
      if (this.duration === 0) {
        this.shouldDispose = true;
      }
    }
    const ctx = cf(this.entityId);
    if (ctx && this.usagePerRound > 0) {
      const result = await Entity.handleEvent(this.handler, e, ctx);
      if (result) {
        this.usagePerRound--;
        this.usage--;
        if (this.usage === 0) {
          this.shouldDispose = true;
        }
      }
    }
  }

  getData(): SupportData {
    return {
      entityId: this.entityId,
      id: this.id,
      value: this.getVisibleValue() ?? undefined,
    };
  }

  clone() {
    const clone = shallowClone(this);
    clone.handler = shallowClone(this.handler);
    return clone;
  }
}
