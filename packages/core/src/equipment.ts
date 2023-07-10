import { getEquipment, EquipmentInfoWithId, EventHandlers, ContextOfEvent } from "@gi-tcg/data";
import { Entity, shallowClone } from "./entity.js";
import { ContextFactory } from "./context.js";

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

  getData(): number {
    return this.id;
  }

  clone() {
    const clone = shallowClone(this);
    clone.handler = shallowClone(this.handler);
    return clone;
  }
}
