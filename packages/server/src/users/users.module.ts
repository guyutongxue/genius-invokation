import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { DbModule } from '../db/db.module';
import { UsersController } from './users.controller';
import { InvitationModule } from '../invitation/invitation.module';

@Module({
  imports: [DbModule, forwardRef(() => InvitationModule)],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {
}
