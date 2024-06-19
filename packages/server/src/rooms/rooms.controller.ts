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
  Param,
  ParseIntPipe,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { IsBoolean, IsIn, IsInt, IsNumber, IsObject, IsOptional, Max, Min } from "class-validator";
import { RoomsService } from "./rooms.service";
import { User } from "../auth/user.decorator";
import type { RpcMethod, RpcResponse } from "@gi-tcg/typings";
import { VERSIONS, type Version } from "@gi-tcg/core";

export class CreateRoomDto {
  @IsBoolean()
  @IsOptional()
  hostFirst?: boolean;

  @IsIn(VERSIONS)
  @IsOptional()
  gameVersion?: Version;

  @IsInt()
  hostDeckId!: number;

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

export class JoinRoomDto {
  @IsInt()
  deckId!: number;
}

export class PlayerActionResponseDto {
  @IsInt()
  id!: number;

  @IsObject()
  response!: RpcResponse[RpcMethod];
}


@Controller("api/rooms")
export class RoomsController {
  constructor(private rooms: RoomsService) {}

  @Get()
  getRooms(@User() userId: number) {
    return this.rooms.getAllRooms();
  }

  @Post()
  createRoom(@User() userId: number, @Body() params: CreateRoomDto) {
    return this.rooms.createRoom(userId, params);
  }

  @Get(":roomId")
  getRoom(
    @User() userId: number,
    @Param("roomId", ParseIntPipe) roomId: number,
  ) {
    return this.rooms.getRoom(roomId);
  }

  // Add this for sendBeacon
  @Post("delete/:roomId")
  deleteRoomBeacon(
    @User() userId: number,
    @Param("roomId", ParseIntPipe) roomId: number,
  ) {
    return this.rooms.deleteRoom(userId, roomId);
  }

  @Delete(":roomId")
  deleteRoom(
    @User() userId: number,
    @Param("roomId", ParseIntPipe) roomId: number,
  ) {
    return this.rooms.deleteRoom(userId, roomId);
  }

  @Post(":roomId/players")
  joinRoom(
    @User() userId: number,
    @Param("roomId", ParseIntPipe) roomId: number,
    @Body() { deckId }: JoinRoomDto,
  ) {
    return this.rooms.joinRoom(userId, roomId, deckId);
  }

  @Get(":roomId/players/:userId/notification")
  getNotification(
    @User() userId: number,
    @Param("roomId", ParseIntPipe) roomId: number,
    @Param("userId", ParseIntPipe) targetUserId: number,
  ) {
    return this.rooms.playerNotification(roomId, userId, targetUserId);
  }

  @Get(":roomId/players/:userId/actionRequest")
  getAction(
    @User() userId: number,
    @Param("roomId", ParseIntPipe) roomId: number,
    @Param("userId", ParseIntPipe) targetUserId: number,
  ) {
    if (userId !== targetUserId) {
      throw new UnauthorizedException(
        `You can only get your own action requests`,
      );
    }
    return this.rooms.playerAction(roomId, userId);
  }

  @Post(":roomId/players/:userId/actionResponse")
  postAction(
    @User() userId: number,
    @Param("roomId", ParseIntPipe) roomId: number,
    @Param("userId", ParseIntPipe) targetUserId: number,
    @Body() action: PlayerActionResponseDto,
  ) {
    if (userId !== targetUserId) {
      throw new UnauthorizedException(
        `You can only post your own action responses`,
      );
    }
    this.rooms.receivePlayerResponse(roomId, userId, action);
    return { message: "response received" };
  }

  @Post(":roomId/players/:userId/giveUp")
  postGiveUp(
    @User() userId: number,
    @Param("roomId", ParseIntPipe) roomId: number,
    @Param("userId", ParseIntPipe) targetUserId: number,
  ) {
    if (userId !== targetUserId) {
      throw new UnauthorizedException(`You can only give up your own game`);
    }
    this.rooms.receivePlayerGiveUp(userId, roomId);
    return { message: "given up" };
  }
}
