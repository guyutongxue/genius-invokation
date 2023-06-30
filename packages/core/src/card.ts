import { CardInfoWithId, getCard } from "@gi-tcg/data";
import { newEntityId } from "./entity_id.js";

export class Card {
  private readonly entityId: number;
  private readonly info: CardInfoWithId;
  constructor(private readonly id: number) {
    this.entityId = newEntityId();
    this.info = getCard(id);
  }
}
