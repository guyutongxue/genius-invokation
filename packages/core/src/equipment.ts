import { getEquipment, EquipmentInfoWithId, EventHandlers } from "@gi-tcg/data";
import { Entity, shallowClone } from "./entity.js";
import { EventFactory } from "./context.js";

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

  protected override onRoundBegin(): void {
    this.usagePerRound = this.info.usagePerRound;
  }

  async handleEvent(event: EventFactory)  {
    if (this.usagePerRound <= 0) return;
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
