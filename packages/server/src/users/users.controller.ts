import { Body, Controller, Get, NotFoundException, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '../auth/user.decorator';
import { IsNotEmpty } from 'class-validator';
import { User as UserT } from '@prisma/client';

class SetPasswordDto {
  @IsNotEmpty()
  password!: string;
}

class SetNameDto {
  @IsNotEmpty()
  name!: string;
}

type UserNoPassword = Exclude<UserT, 'password' | 'salt'>;

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

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
}
