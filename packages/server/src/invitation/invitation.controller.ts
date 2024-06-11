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
