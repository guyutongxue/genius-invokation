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
import type { PaginationDto } from "../utils";

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

  async getAllGames({ skip = 0, take = 100 }: PaginationDto) {
    return await this.prisma.game.findMany({
      skip,
      take,
      omit: { data: true },
      include: {
        players: {
          select: {
            player: {
              select: {
                id: true,
                name: true,
              }
            },
            who: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  async getGame(gameId: number) {
    return await this.prisma.game.findFirst({
      where: {
        id: gameId,
      },
      include: {
        players: {
          select: {
            player: {
              select: {
                id: true,
                name: true,
              }
            },
            who: true,
          }
        }
      }
    });
  }

  async gamesHasUser(userId: number, { skip = 0, take = 100 }: PaginationDto) {
    const results = await this.prisma.playerOnGames.findMany({
      skip,
      take,
      where: {
        playerId: userId,
      },
      include: {
        game: {
          omit: {
            data: true
          }
        }
      }
    });
    return results;
  }
}
