import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { User } from '../auth/user.decorator';
import { InvitationService } from './invitation.service';

@Controller('invitationCodes')
export class InvitationController {

  constructor(private invitation: InvitationService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post()
  async createInvitationCode(@User() userId: number) {
    const code = await this.invitation.createInvitationCode(userId);
    return { code };
  }
}
