import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Post, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '../auth/user.decorator';
import { Allow, IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
import { User as UserT } from '@prisma/client';
import { Public } from '../auth/auth.guard';
import { InvitationService } from '../invitation/invitation.service';

class SetPasswordDto {
  @IsNotEmpty()
  password!: string;
}

class SetNameDto {
  @IsNotEmpty()
  name!: string;
}

class RegisterDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @MaxLength(64)
  password!: string;

  @Allow()
  code?: string;
}

type UserNoPassword = Exclude<UserT, 'password' | 'salt'>;

@Controller('users')
export class UsersController {
  constructor(private users: UsersService, private invitation: InvitationService) {}

  @Get("me")
  async me(@User() userId: number): Promise<UserNoPassword> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundException();
    }
    const userObj: any = { ...user };
    delete userObj.password;
    delete userObj.salt;
    return userObj;
  }

  @Put("me/password")
  async setPassword(@User() userId: number, @Body() { password }: SetPasswordDto) {
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
      throw new BadRequestException(`We now require an invitation code to register. Please ask a friend for one.`);
    }
    const result = await this.invitation.useInvitationCode(code);
    if (result === null) {
      throw new BadRequestException(`Invalid invitation code.`);
    }
    await this.users.create(email, password);
    return { message: "User created" };
  }
}
