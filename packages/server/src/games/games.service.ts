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

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../db/prisma.service";
import type { Game as GameModel } from "@prisma/client";

export interface AddGameOption {
  playerIds: number[];
  version: string;
  data: string;
  winnerId: number | null;
}

@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  async addGame({ playerIds, ...data }: AddGameOption): Promise<GameModel> {
    const playerOnGames = playerIds.map((id, who) => ({
      playerId: id,
      who,
    }));
    const game = await this.prisma.game.create({
      data: {
        ...data,
        players: {
          create: playerOnGames,
        },
      },
    });
    return game;
  }

  async allGames() {
    return await this.prisma.game.findMany();
  }

  async gamesHasUser(userId: number) {
    const results = await this.prisma.playerOnGames.findMany({
      where: {
        playerId: userId,
      },
      include: {
        game: true
      }
    });
    return results;
  }
}
