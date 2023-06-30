import { CardInfoWithId, getCard } from "@gi-tcg/data";
import { Entity } from "./entity.js";

export class Card extends Entity {
  private readonly info: CardInfoWithId;
  constructor(id: number) {
    super(id);
    this.info = getCard(id);
  }

  isArcane() {
    return this.info.tags.includes("arcane");
  }

  getData() {
    return {
      entityId: this.entityId,
      id: this.id,
    };
  }
}
