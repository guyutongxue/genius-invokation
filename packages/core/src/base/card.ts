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

import { CharacterTag, WeaponTag } from "./character";
import { DescriptionDictionary } from "./entity";
import {
  InitiativeSkillDefinition,
  InitiativeSkillEventArg,
  SkillInfo,
} from "./skill";
import { AnyState, GameState } from "./state";
import { VersionInfo } from "./version";

export type WeaponCardTag = Exclude<WeaponTag, "other">;

export type EquipmentTag =
  | "talent"
  | "artifact"
  | "technique"
  | "weapon"
  | WeaponCardTag;

export type SupportTag = "ally" | "place" | "item";

export type CardTag =
  | "legend" // 秘传
  | "action" // 出战行动
  | "food"
  | "resonance" // 元素共鸣
  | "noTuning" // 禁用调和
  | EquipmentTag
  | SupportTag;

export type CardType = "event" | "support" | "equipment";

export type InitiativeSkillTargetKind = readonly ("character" | "summon")[];

export interface CardDefinition extends InitiativeSkillDefinition {
  readonly __definition: "cards";
  readonly cardType: CardType;
  readonly version: VersionInfo;
  readonly tags: readonly CardTag[];
  readonly onDispose?: InitiativeSkillDefinition;
  readonly descriptionDictionary: DescriptionDictionary;
}
