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

import { Module } from "@nestjs/common";
import { RoomsService } from "./rooms.service";
import { RoomsController } from "./rooms.controller";
import { DecksModule } from "../decks/decks.module";
import { UsersModule } from "../users/users.module";
import { GamesModule } from "../games/games.module";
import { AuthModule } from "../auth/auth.module";
import { IntOrStringPipe } from "./rooms.pipe";

@Module({
  imports: [DecksModule, UsersModule, GamesModule, AuthModule],
  providers: [RoomsService, IntOrStringPipe],
  controllers: [RoomsController],
})
export class RoomsModule {}
