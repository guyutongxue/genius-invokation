import a from "./data/action_cards.json" with { type: "json" };
import c from "./data/characters.json" with { type: "json" };
import e from "./data/entities.json" with { type: "json" };
import k from "./data/keywords.json" with { type: "json" };

import type {
  ActionCardRawData,
  CharacterRawData,
  EntityRawData,
  KeywordRawData,
} from "../scripts/typings";

export const actionCards: ActionCardRawData[] = a as ActionCardRawData[];
export const characters: CharacterRawData[] = c;
export const entities: EntityRawData[] = e as EntityRawData[];
export const keywords: KeywordRawData[] = k;

export type * from "../scripts/typings";
