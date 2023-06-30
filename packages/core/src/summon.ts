import { EventHandlers, getSummon, SummonInfoWithId } from "@gi-tcg/data";
import { Entity, shallowClone } from "./entity.js";
import { SummonData } from "@gi-tcg/typings";

export class Summon extends Entity {
  private readonly info: SummonInfoWithId;
  private handler: EventHandlers;

  constructor(id: number) {
    super(id);
    this.info = getSummon(id);
    this.handler = new this.info.handlerCtor();
  }
  
  getVisibleValue(): number {
    // TODO
    return 0;
  }

  getData(): SummonData {
    return {
      entityId: this.entityId,
      id: this.id,
      value: this.getVisibleValue(),
    };
  }

  clone() {
    const clone = shallowClone(this);
    clone.handler = shallowClone(this.handler);
    return clone;
  }
}
