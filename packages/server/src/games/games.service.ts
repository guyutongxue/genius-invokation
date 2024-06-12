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

import { Injectable } from '@nestjs/common';
import { GameConfig, Game as InternalGame } from "@gi-tcg/core";
import data from "@gi-tcg/data"; 

interface GameInstanceConfig extends GameConfig {
  switchHandTime: number; // defaults 45
  rerollTime: number; // defaults 40
  roundTotalActionTime: number; // defaults 60
  actionTime: number; // defaults 25
}

class GameInstance {
  private game: InternalGame;
  private players: [number, number];

  constructor() {
    this.game = new InternalGame({
      data,
      gameConfig: {},
      playerConfigs: []
    });
  }
}

@Injectable()
export class GamesService {}
