import {
  EventHandlers,
  getSupport,
  SupportInfoWithId,
} from "@gi-tcg/data";
import { Entity, shallowClone } from "./entity.js";
import { SupportData } from "@gi-tcg/typings";
import { EventFactory, TrivialEvent } from "./context.js";

export class Support extends Entity {
  public readonly info: SupportInfoWithId;
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
    for (const prop of Object.values(this.handler)) {
      if (typeof prop === "number" && isFinite(prop)) {
        return prop;
      }
    }
    return null;
  }

  protected override onRoundBegin(): void {
    this.usagePerRound = this.info.usagePerRound;
    this.duration--;
    if (this.duration === 0) {
      this.shouldDispose = true;
    }
  }
  async handleEvent(event: EventFactory)  {
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
