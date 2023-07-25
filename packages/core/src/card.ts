import { CardInfo, Context, getCard } from "@gi-tcg/data";
import { Entity } from "./entity.js";
import { PlayCardContextImpl } from "./context.js";

export class Card extends Entity {
  public readonly info: CardInfo;
  constructor(id: number) {
    super(id);
    this.info = getCard(id);
  }

  isLegend() {
    return this.info.tags.includes("legend");
  }

  do(ctx: PlayCardContextImpl) {
    return this.info.action.call(ctx.target, ctx);
  }

  getData() {
    return {
      entityId: this.entityId,
      id: this.id,
    };
  }
}
