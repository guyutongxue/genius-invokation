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

import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../db/prisma.service";
import type { CreateDeckDto, UpdateDeckDto } from "./decks.controller";
import { type Deck, encode, decode } from "@gi-tcg/utils";
import { type Deck as DeckModel } from "@prisma/client";
import { DeckVerificationError, verifyDeck } from "../utils";

export interface DeckWithDeckModel extends Deck {
  id: number;
  name: string;
  code: string;
}

@Injectable()
export class DecksService {
  constructor(private prisma: PrismaService) {}

  private deckToCode(deck: Deck) {
    try {
      verifyDeck(deck);
      return encode(deck);
    } catch (e) {
      if (e instanceof Error) {
        throw new BadRequestException(e.message);
      } else {
        throw e;
      }
    }
  }

  async createDeck(userId: number, deck: CreateDeckDto): Promise<DeckModel> {
    const code = this.deckToCode(deck);
    return await this.prisma.deck.create({
      data: {
        name: deck.name,
        code,
        ownerUserId: userId,
      },
    });
  }

  async getAllDecks(userId: number): Promise<DeckWithDeckModel[]> {
    const models = await this.prisma.deck.findMany({
      where: {
        ownerUserId: userId,
      },
    });
    return models.map((model) => {
      const { characters, cards } = decode(model.code);
      return {
        id: model.id,
        name: model.name,
        code: model.code,
        characters,
        cards,
      };
    });
  }

  async getDeck(
    userId: number,
    deckId: number,
  ): Promise<DeckWithDeckModel | null> {
    const model = await this.prisma.deck.findFirst({
      where: {
        id: deckId,
        ownerUserId: userId,
      },
    });
    if (model === null) {
      return null;
    }
    const { characters, cards } = decode(model.code);
    return {
      id: model.id,
      name: model.name,
      code: model.code,
      characters,
      cards,
    };
  }

  async updateDeck(
    userId: number,
    deckId: number,
    deck: UpdateDeckDto,
  ): Promise<DeckModel> {
    let code: string | undefined;
    if (!deck.characters || !deck.cards) {
      if (!deck.characters && !deck.cards) {
        code = void 0;
      } else {
        throw new BadRequestException(
          `characters and cards must be provided together`,
        );
      }
    } else {
      code = this.deckToCode({
        characters: deck.characters,
        cards: deck.cards,
      });
    }
    return await this.prisma.deck.update({
      where: {
        id: deckId,
        ownerUserId: userId,
      },
      data: {
        name: deck.name,
        code,
      },
    });
  }

  async deleteDeck(userId: number, deckId: number) {
    await this.prisma.deck.delete({
      where: {
        id: deckId,
        ownerUserId: userId,
      },
    });
  }
}
