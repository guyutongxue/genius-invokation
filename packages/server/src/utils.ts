// Copyright (C) 2024 Guyutongxue
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import type { Deck } from "@gi-tcg/utils";
import {
  characters as characterData,
  actionCards as actionCardData,
} from "@gi-tcg/static-data";
import { IsInt, IsOptional, IsPositive, Max } from "class-validator";

export class DeckVerificationError extends Error {}

export function verifyDeck({ characters, cards }: Deck) {
  if (characters.length !== 3) {
    throw new DeckVerificationError("deck must contain 3 characters");
  }
  if (cards.length !== 30) {
    throw new DeckVerificationError("deck must contain 30 cards");
  }
  const characterTags = [];
  for (const chId of characters) {
    const character = characterData.find((ch) => ch.id === chId);
    if (!character) {
      throw new DeckVerificationError(`character id ${chId} not found`);
    }
    if (!character.obtainable) {
      throw new DeckVerificationError(`character id ${chId} not obtainable`);
    }
    characterTags.push(...character.tags);
  }
  const cardCounts = new Map<number, number>();
  for (const cardId of cards) {
    if (cardCounts.has(cardId)) {
      const count = cardCounts.get(cardId)! + 1;
      if (count > 2) {
        throw new DeckVerificationError(`card id ${cardId} included more than twice`);
      }
      cardCounts.set(cardId, count);
    } else {
      const card = actionCardData.find((c) => c.id === cardId);
      if (!card) {
        throw new DeckVerificationError(`card id ${cardId} not found`);
      }
      if (!card.obtainable) {
        throw new DeckVerificationError(`card id ${cardId} not obtainable`);
      }
      if (
        card.relatedCharacterId !== null &&
        !characters.includes(card.relatedCharacterId)
      ) {
        throw new DeckVerificationError(
          `card id ${cardId} related character not in deck`,
        );
      }
      for (const requiredTag of card.relatedCharacterTags) {
        const idx = characterTags.indexOf(requiredTag);
        if (idx === -1) {
          throw new DeckVerificationError(
            `card id ${cardId} related character tags not in deck`,
          );
        }
        characterTags.splice(idx, 1);
      }
      cardCounts.set(cardId, 1);
    }
  }
}

export class PaginationDto {
  @IsInt()
  @IsPositive()
  @IsOptional()
  skip?: number;

  @IsInt()
  @IsPositive()
  @Max(100)
  @IsOptional()
  take?: number;
}
