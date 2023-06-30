import { EventHandlers, getStatus, StatusInfoWithId } from "@gi-tcg/data";
import { Entity, shallowClone } from "./entity.js";
import { StatusData } from "@gi-tcg/typings";

export class Status extends Entity {
  private readonly info: StatusInfoWithId;
  private handler: EventHandlers;

  constructor(id: number) {
    super(id);
    this.info = getStatus(id);
    this.handler = new this.info.handlerCtor();
  }

  getVisibleValue(): number | null {
    // TODO
    return null;
  }

  getData(): StatusData {
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
