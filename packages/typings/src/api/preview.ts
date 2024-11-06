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

import { Aura, Reaction } from "../enums";
import { EntityData } from "./notification";

export interface NewAuraPreview {
  type: "newAura";
  character: number;
  value: Aura;
}

export interface NewHealthPreview {
  type: "newHealth";
  character: number;
  value: number;
}

export interface NewEnergyPreview {
  type: "newEnergy";
  character: number;
  value: number;
}

export interface ReactionPreview {
  type: "reaction";
  character: number;
  value: Reaction;
}

export interface DefeatedPreview {
  type: "defeated";
  character: number;
}

export interface NewActivePreview {
  type: "newActive";
  character: number;
}

export interface NewEntityPreview {
  type: "newEntity";
  who: 0 | 1;
  where: "summons" | "supports";
  state: EntityData;
}

export interface EntityVarDiffPreview {
  type: "entityVarDiff";
  entity: number;
  newValue: number;
}

export interface DisposedEntityPreview {
  type: "disposedEntity";
  entity: number;
}

export type PreviewData =
  | NewAuraPreview
  | NewHealthPreview
  | NewEnergyPreview
  | ReactionPreview
  | DefeatedPreview
  | NewActivePreview
  | NewEntityPreview
  | EntityVarDiffPreview
  | DisposedEntityPreview;
