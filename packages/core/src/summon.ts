import { EventHandlers, getSummon, SummonInfoWithId } from "@gi-tcg/data";
import { Entity, shallowClone } from "./entity.js";
import { SummonData } from "@gi-tcg/typings";
import { EventFactory } from "./context.js";

export class Summon extends Entity {
  public readonly info: SummonInfoWithId;
  private handler: EventHandlers;
  private usage: number;
  shouldDispose = false;

  constructor(id: number) {
    super(id);
    this.info = getSummon(id);
    this.handler = new this.info.handlerCtor();
    this.usage = this.info.usage;
  }

  getUsage() {
    return this.usage;
  }
  setUsage(value: number) {
    this.usage = Math.min(this.info.maxUsage, value);
  }

  refresh() {
    this.usage = Math.min(this.usage + this.info.usage, this.info.maxUsage);
  }

  getData(): SummonData {
    return {
      entityId: this.entityId,
      id: this.id,
      value: this.usage,
    };
  }

  async handleEvent(event: EventFactory)  {
    if (this.shouldDispose) return;
    const result = await this.doHandleEvent(this.handler, event);
    if (result) {
      this.usage--;
      if (this.info.disposeWhenUsedUp && this.usage === 0) {
        this.shouldDispose = true;
      }
    }
  }
  handleEventSync(event: EventFactory) {
    if (this.shouldDispose) return;
    const result = this.doHandleEventSync(this.handler, event);
    if (result) {
      this.usage--;
      if (this.info.disposeWhenUsedUp && this.usage === 0) {
        this.shouldDispose = true;
      }
    }
  }

  clone() {
    const clone = shallowClone(this);
    clone.handler = shallowClone(this.handler);
    return clone;
  }
}
