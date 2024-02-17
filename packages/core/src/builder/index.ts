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

// 解决循环依赖问题
import "./context";

export { character } from "./character";
export { skill } from "./skill";
export { card } from "./card";
export { summon, status, combatStatus } from "./entity";
export {
  beginRegistration,
  endRegistration,
  type ReadonlyDataStore,
} from "./registry";
export type {
  CardHandle,
  CharacterHandle,
  CombatStatusHandle,
  EntityHandle,
  EquipmentHandle,
  SkillHandle,
  StatusHandle,
  SummonHandle,
  SupportHandle,
  PassiveSkillHandle
} from "./type";
export { DiceType, DamageType, Aura } from "@gi-tcg/typings";
export type { CharacterState, EntityState } from "../base/state";

export { flip } from "@gi-tcg/utils";
