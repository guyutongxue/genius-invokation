import { CharacterInfoWithId, getCharacter } from "@gi-tcg/data";
import { newEntityId } from "./entity_id.js";

export class Character {
  private readonly entityId: number;
  private readonly info: CharacterInfoWithId;
  constructor(private readonly id: number) {
    this.entityId = newEntityId();
    this.info = getCharacter(id);
  }
};
