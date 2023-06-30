import { getEquipment, EquipmentInfoWithId, EventHandlers } from "@gi-tcg/data";
import { Entity, shallowClone } from "./entity.js";

export class Equipment extends Entity {
  private readonly info: EquipmentInfoWithId;
  private handler: EventHandlers;

  constructor(id: number) {
    super(id);
    this.info = getEquipment(id);
    this.handler = new this.info.handlerCtor();
  }

  isWeapon() {
    return this.info.type === "weapon";
  }
  isArtifact() {
    return this.info.type === "artifact";
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
