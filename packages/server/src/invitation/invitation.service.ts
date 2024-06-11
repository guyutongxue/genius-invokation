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

import crypto from "node:crypto";
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class InvitationService {
  constructor(private prisma: PrismaService, private users: UsersService) {}

  async createInvitationCode(userId: number) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    if (user.rank !== 0) {
      throw new UnauthorizedException();
    }
    const code = crypto.randomBytes(16).toString("hex");
    await this.prisma.invitationCode.create({
      data: {
        code,
        createdByUserId: userId,
      },
    });
    return code;
  }

  async useInvitationCode(code: string) {
    const invitation = await this.prisma.invitationCode.findFirst({
      where: { code },
    });
    if (!invitation || invitation.used) {
      return null;
    }
    await this.prisma.invitationCode.update({
      where: { id: invitation.id },
      data: { used: true }
    });
    return invitation.createdByUserId;
  }
}
