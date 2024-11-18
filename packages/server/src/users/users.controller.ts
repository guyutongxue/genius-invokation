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
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import { UsersService, type UserInfo } from "./users.service";
import { User } from "../auth/user.decorator";

@Controller("users")
export class UsersController {
  constructor(
    private users: UsersService,
  ) {}

  @Get("me")
  async me(@User() userId: number): Promise<UserInfo> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }

  @Get(":id")
  async getUser(@Param("id", ParseIntPipe) id: number): Promise<UserInfo> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }
}
