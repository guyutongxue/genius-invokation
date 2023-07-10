import { CardInfoWithId, getCard } from "@gi-tcg/data";
import { Entity } from "./entity.js";

export class Card extends Entity {
  public readonly info: CardInfoWithId;
  constructor(id: number) {
    super(id);
    this.info = getCard(id);
  }

  isLegend() {
    return this.info.tags.includes("legend");
  }

  getData() {
    return {
      entityId: this.entityId,
      id: this.id,
    };
  }
}
