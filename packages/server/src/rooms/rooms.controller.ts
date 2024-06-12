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

import { Controller, Post } from '@nestjs/common';
import { IsBoolean, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class CreateRoomDto {
  @IsBoolean()
  @IsOptional()
  hostFirst?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  initTotalActionTime?: number;

  @IsNumber()
  @IsOptional()
  @Min(25)
  rerollTime?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  roundTotalActionTime?: number;

  @IsNumber()
  @IsOptional()
  @Min(25)
  actionTime?: number;

  @IsNumber()
  @Min(0)
  @Max(2147483546)
  @IsOptional()
  randomSeed?: number;

  @IsBoolean()
  @IsOptional()
  watchable?: boolean;
}

@Controller('rooms')
export class RoomsController {
  @Post()
  createRoom() {}

}
