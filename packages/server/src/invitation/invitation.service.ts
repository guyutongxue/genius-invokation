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
    if (!invitation) {
      return null;
    }
    await this.prisma.invitationCode.update({
      where: { id: invitation.id },
      data: { used: true }
    });
    return invitation.createdByUserId;
  }
}
