import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService {

  constructor(
    private users: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const result = await this.users.verifyPassword(email, password);
    if (!result) {
      throw new UnauthorizedException();
    }
    const payload = { sub: result.id };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
