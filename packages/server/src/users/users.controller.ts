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
  Put,
} from "@nestjs/common";
import { UsersService, type UserNoPassword } from "./users.service";
import { User } from "../auth/user.decorator";
import {
  Allow,
  IsEmail,
  IsNotEmpty,
  Length,
  MaxLength,
} from "class-validator";
import { type User as UserModel } from "@prisma/client";
import { Public } from "../auth/auth.guard";
import { InvitationService } from "../invitation/invitation.service";

class SetPasswordDto {
  @Length(6, 64)
  password!: string;
}

class SetNameDto {
  @IsNotEmpty()
  @MaxLength(64)
  name!: string;
}

class RegisterDto {
  @IsEmail()
  email!: string;

  @Length(6, 64)
  password!: string;

  @Allow()
  code?: string;
}


@Controller("users")
export class UsersController {
  constructor(
    private users: UsersService,
  ) {}

  @Get("me")
  async me(@User() userId: number): Promise<UserNoPassword> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }

  @Get(":id")
  async getUser(@Param("id", ParseIntPipe) id: number): Promise<UserNoPassword> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }

  @Put("me/password")
  async setPassword(
    @User() userId: number,
    @Body() { password }: SetPasswordDto,
  ) {
    await this.users.updatePassword(userId, password);
    return { message: "Password updated" };
  }

  @Put("me/name")
  async setName(@User() userId: number, @Body() { name }: SetNameDto) {
    await this.users.updateName(userId, name);
    return { message: "Name updated" };
  }

  @HttpCode(HttpStatus.CREATED)
  @Public()
  @Post()
  async registerUser(@Body() { email, password, code }: RegisterDto) {
    if (!code) {
      throw new BadRequestException(
        `We now require an invitation code to register. Please ask a friend for one.`,
      );
    }
    await this.users.create(email, password, { code });
    return { message: "User created" };
  }
}
