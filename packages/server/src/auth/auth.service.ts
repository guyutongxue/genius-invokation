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

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import axios from "axios";

@Injectable()
export class AuthService {

  constructor(
    private users: UsersService,
    private jwtService: JwtService,
  ) {}

  private async getGitHubId(code: string) {
    const response = await axios.post(`https://github.com/login/oauth/access_token`, {
      client_id: process.env.GH_CLIENT_ID,
      client_secret: process.env.GH_CLIENT_SECRET,
      code,
    }, {
      headers: {
        Accept: "application/json",
      },
    });
    if (response.status !== 200) {
      throw new UnauthorizedException();
    }
    const accessToken = response.data.access_token;
    const userResponse = await axios.get(`https://api.github.com/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: `application/vnd.github+json`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (userResponse.status !== 200) {
      throw new UnauthorizedException();
    }
    return {
      id: userResponse.data.id,
    };
  }

  async login(code: string) {
    const { id } = await this.getGitHubId(code);
    await this.users.create(id);
    const payload = { sub: id };
    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }
}
