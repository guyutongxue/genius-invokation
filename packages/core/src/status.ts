import {
  EventHandlers,
  getStatus,
  StatusInfoWithId,
} from "@gi-tcg/data";
import { Entity, shallowClone } from "./entity.js";
import { StatusData } from "@gi-tcg/typings";
import { EventAndContext, EventFactory } from "./context.js";

export class Status extends Entity {
  public readonly info: StatusInfoWithId;
  private handler: EventHandlers;
  usagePerRound: number;
  usage: number;
  duration: number;
  shield: number | null = null;
  prepare: number | null = null;
  shouldDispose = false;

  constructor(id: number) {
    super(id);
    this.info = getStatus(id);
    this.handler = new this.info.handlerCtor();
    this.usage = this.info.usage;
    this.usagePerRound = this.info.usagePerRound;
    this.duration = this.info.duration;
    this.shield =
      typeof this.info.shield === "number"
        ? this.info.shield
        : this.info.shield?.initial ?? null;
  }

  private getVisibleValueProp(): "shield" | "usage" | "duration" | null {
    if (this.shield !== null) {
      return "shield";
    }
    if (this.info.usage !== 1 && isFinite(this.usage)) {
      return "usage";
    }
    if (this.info.duration !== 1 && isFinite(this.duration)) {
      return "duration";
    }
    return null;
  }

  get visibleValue(): number | null {
    const prop = this.getVisibleValueProp();
    if (prop === null) {
      return null;
    } else {
      return this[prop];
    }
  }
  set visibleValue(value: number) {
    const prop = this.getVisibleValueProp();
    if (prop !== null) {
      this[prop] = value;
    }
  }

  async handleEvent(event: EventAndContext | EventFactory) {
    if (Array.isArray(event) && event[0] === "onRollPhase") {
      this.usagePerRound = this.info.usagePerRound;
      this.duration--;
      if (this.duration === 0) {
        this.shouldDispose = true;
      }
    }
    if (this.shouldDispose || this.usagePerRound === 0) return;
    const result = await this.doHandleEvent(this.handler, event);
    if (result) {
      this.usagePerRound--;
      this.usage--;
      if (this.usage === 0) {
        this.shouldDispose = true;
      }
    }
  }

  getData(): StatusData {
    return {
      entityId: this.entityId,
      id: this.id,
      value: this.visibleValue ?? undefined,
    };
  }

  clone() {
    const clone = shallowClone(this);
    clone.handler = shallowClone(this.handler);
    return clone;
  }
}
