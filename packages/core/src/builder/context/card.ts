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
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { CardState } from "../../base/state";
import { getEntityById } from "../../utils";
import { ContextMetaBase, SkillContext } from "./skill";

export class Card<Meta extends ContextMetaBase> {
  constructor(
    private readonly skillContext: SkillContext<Meta>,
    public readonly id: number,
  ) {}
  
  get state(): CardState {
    return getEntityById(this.skillContext.state, this.id) as CardState;
  }
}
