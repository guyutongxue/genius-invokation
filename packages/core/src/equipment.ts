import { getEquipment, EquipmentInfoWithId, EventHandlers, ContextOfEvent, EventHandlerNames } from "@gi-tcg/data";
import { Entity, shallowClone } from "./entity.js";
import { EventAndContext, EventFactory } from "./context.js";

export class Equipment extends Entity {
  public readonly info: EquipmentInfoWithId;
  private handler: EventHandlers;
  private usagePerRound: number;

  constructor(id: number) {
    super(id);
    this.info = getEquipment(id);
    this.handler = new this.info.handlerCtor();
    this.usagePerRound = this.info.usagePerRound;
  }

  isWeapon() {
    return this.info.type === "weapon";
  }
  isArtifact() {
    return this.info.type === "artifact";
  }

  async handleEvent(event: EventAndContext | EventFactory)  {
    if (Array.isArray(event) && event[0] === "onRollPhase") {
      this.usagePerRound = this.info.usagePerRound;
    }
    const result = await this.doHandleEvent(this.handler, event);
    if (result) {
      this.usagePerRound--;
    }
  }

  getData(): number {
    return this.id;
  }

  clone() {
    const clone = shallowClone(this);
    clone.handler = shallowClone(this.handler);
    return clone;
  }
}
