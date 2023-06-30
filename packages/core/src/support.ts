import { EventHandlers, getSupport, SupportInfoWithId } from "@gi-tcg/data";
import { Entity, shallowClone } from "./entity.js";
import { SupportData } from "@gi-tcg/typings";

export class Support extends Entity {
  private readonly info: SupportInfoWithId;
  private handler: EventHandlers;

  constructor(id: number) {
    super(id);
    this.info = getSupport(id);
    this.handler = new this.info.handlerCtor();
  }

  getVisibleValue(): number | null {
    // TODO
    return null;
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
