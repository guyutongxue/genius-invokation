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
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Sse,
  UnauthorizedException,
} from "@nestjs/common";
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  Length,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { RoomsService, type PlayerId } from "./rooms.service";
import { Guest, User, UserOrGuest } from "../auth/user.decorator";
import type { RpcMethod, RpcResponse } from "@gi-tcg/typings";
import { VERSIONS, type Version } from "@gi-tcg/core";
import { DeckDto } from "../decks/decks.controller";
import { Public } from "../auth/auth.guard";
import { validateDto } from "../utils";
import { AuthService } from "../auth/auth.service";
import { IntOrStringPipe } from "./rooms.pipe";

export class CreateRoomDto {
  @IsBoolean()
  @IsOptional()
  hostFirst?: boolean;

  @IsInt()
  @Min(0)
  @Max(VERSIONS.length - 1)
  @IsOptional()
  gameVersion?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  initTotalActionTime?: number;

  @IsNumber()
  @IsOptional()
  @Min(25)
  rerollTime?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  roundTotalActionTime?: number;

  @IsNumber()
  @IsOptional()
  @Min(25)
  actionTime?: number;

  @IsNumber()
  @Min(0)
  @Max(2147483546)
  @IsOptional()
  randomSeed?: number;

  @IsBoolean()
  @IsOptional()
  watchable?: boolean;

  @IsBoolean()
  @IsOptional()
  private?: boolean;
}

export class UserCreateRoomDto extends CreateRoomDto {
  @IsInt()
  hostDeckId!: number;
}

export class GuestCreateRoomDto extends CreateRoomDto {
  @Length(1, 64)
  name!: string;

  @ValidateNested()
  deck!: DeckDto;
}

export class UserJoinRoomDto {
  @IsInt()
  deckId!: number;
}

export class GuestJoinRoomDto {
  @Length(1, 64)
  name!: string;

  @ValidateNested()
  deck!: DeckDto;
}

export class PlayerActionResponseDto {
  @IsInt()
  id!: number;

  @IsObject()
  response!: RpcResponse[RpcMethod];
}

@Controller("rooms")
@Public()
export class RoomsController {
  constructor(private rooms: RoomsService, private authService: AuthService) {}

  @Get()
  getRooms() {
    return this.rooms.getAllRooms();
  }

  @Post()
  async createRoom(
    @User() userId: number | null,
    @Guest() guestId: string | null,
    @Body() params: unknown,
  ) {
    if (userId !== null) {
      const dto = await validateDto(params, UserCreateRoomDto);
      return this.rooms.createRoomFromUser(userId, dto);
    } else {
      const dto = await validateDto(params, GuestCreateRoomDto);
      const { playerId, room } = await this.rooms.createRoomFromGuest(guestId, dto);
      return {
        accessToken: await this.authService.signGuest(playerId),
        playerId,
        room,
      }
    }
  }

  @Get("current")
  getCurrentRoom(@UserOrGuest() playerId: number | string | null) {
    if (playerId !== null) {
      return this.rooms.currentRoom(playerId);
    } else {
      return null;
    }
  }

  @Get(":roomId")
  getRoom(@Param("roomId", ParseIntPipe) roomId: number) {
    return this.rooms.getRoom(roomId);
  }

  @Delete(":roomId")
  deleteRoom(
    @UserOrGuest() playerId: number | string | null,
    @Param("roomId", ParseIntPipe) roomId: number,
  ) {
    if (playerId === null) {
      throw new UnauthorizedException();
    }
    return this.rooms.deleteRoom(playerId, roomId);
  }

  @Post(":roomId/players")
  async joinRoom(
    @User() userId: number | null,
    @Guest() guestId: string | null,
    @Param("roomId", ParseIntPipe) roomId: number,
    @Body() params: object,
  ) {
    if (userId !== null) {
      const dto = await validateDto(params, UserJoinRoomDto);
      return this.rooms.joinRoomFromUser(userId, roomId, dto.deckId);
    } else {
      const dto = await validateDto(params, GuestJoinRoomDto);
      const { playerId } = await  this.rooms.joinRoomFromGuest(guestId, roomId, dto);
      return {
        accessToken: await this.authService.signGuest(playerId),
        playerId,
      }
    }
  }

  @Sse(":roomId/players/:targetPlayerId/notification")
  getNotification(
    @UserOrGuest() playerId: number | string | null,
    @Param("roomId", ParseIntPipe) roomId: number,
    @Param("targetPlayerId", IntOrStringPipe) targetPlayerId: string | number,
  ) {
    return this.rooms.playerNotification(roomId, playerId, targetPlayerId);
  }

  @Sse(":roomId/players/:targetPlayerId/actionRequest")
  getAction(
    @UserOrGuest() playerId: number | string | null,
    @Param("roomId", ParseIntPipe) roomId: number,
    @Param("targetPlayerId", IntOrStringPipe) targetPlayerId: number | string,
  ) {
    if (playerId !== targetPlayerId) {
      throw new UnauthorizedException(
        `You can only get your own action requests`,
      );
    }
    return this.rooms.playerAction(roomId, playerId);
  }

  @Post(":roomId/players/:targetPlayerId/actionResponse")
  postAction(
    @UserOrGuest() playerId: number | string | null,
    @Param("roomId", ParseIntPipe) roomId: number,
    @Param("targetPlayerId", IntOrStringPipe) targetPlayerId: number | string,
    @Body() action: PlayerActionResponseDto,
  ) {
    if (playerId !== targetPlayerId) {
      throw new UnauthorizedException(
        `You can only post your own action responses`,
      );
    }
    this.rooms.receivePlayerResponse(roomId, playerId, action);
    return { message: "response received" };
  }

  @Post(":roomId/players/:targetPlayerId/giveUp")
  postGiveUp(
    @UserOrGuest() playerId: number | string | null,
    @Param("roomId", ParseIntPipe) roomId: number,
    @Param("targetPlayerId", IntOrStringPipe) targetPlayerId: number | string,
  ) {
    if (playerId !== targetPlayerId) {
      throw new UnauthorizedException(`You can only give up your own game`);
    }
    this.rooms.receivePlayerGiveUp(roomId, playerId);
    return { message: "given up" };
  }
}
