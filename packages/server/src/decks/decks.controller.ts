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

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { User } from "../auth/user.decorator";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsInt,
  IsOptional,
  IsString,
  Length,
} from "class-validator";
import { DecksService } from "./decks.service";

export class CreateDeckDto {
  @Length(1, 64)
  name!: string;

  @IsInt({ each: true })
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  characters!: number[];

  @IsInt({ each: true })
  @ArrayMinSize(30)
  @ArrayMaxSize(30)
  cards!: number[];
}

export class UpdateDeckDto {
  @Length(1, 64)
  @IsOptional()
  name?: string;

  @IsInt({ each: true })
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @IsOptional()
  characters?: number[];

  @IsInt({ each: true })
  @ArrayMinSize(30)
  @ArrayMaxSize(30)
  @IsOptional()
  cards?: number[];
}

@Controller("decks")
export class DecksController {
  constructor(private decks: DecksService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post()
  async createDeck(@User() userId: number, @Body() deck: CreateDeckDto) {
    const result = await this.decks.createDeck(userId, deck);
    return {
      id: result.id,
      code: result.code,
    };
  }

  @Get()
  async getAllDecks(@User() userId: number) {
    return await this.decks.getAllDecks(userId);
  }

  @Patch(":deckId")
  async updateDeck(
    @User() userId: number,
    @Param("deckId", ParseIntPipe) deckId: number,
    @Body() deck: UpdateDeckDto,
  ) {
    const result = await this.decks.updateDeck(userId, deckId, deck);
    return {
      id: result.id,
      code: result.code,
    };
  }

  @Delete(":deckId")
  async deleteDeck(
    @User() userId: number,
    @Param("deckId", ParseIntPipe) deckId: number,
  ) {
    await this.decks.deleteDeck(userId, deckId);
    return { message: `deck ${deckId} deleted` };
  }
}
