import { Module, forwardRef } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { InvitationController } from './invitation.controller';
import { DbModule } from '../db/db.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [DbModule, forwardRef(() => UsersModule)],
  providers: [InvitationService],
  controllers: [InvitationController],
  exports: [InvitationService]
})
export class InvitationModule {}
