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

export { DiceType as PbDiceType, DiceRequirementType as PbDiceRequirementType, DamageType as PbDamageType, AuraType as PbAuraType } from "./gen/enums";

export enum DiceType {
  Void = 0,
  Cryo = 1,
  Hydro = 2,
  Pyro = 3,
  Electro = 4,
  Anemo = 5,
  Geo = 6,
  Dendro = 7,
  Omni = 8,
  Aligned = 8,
  Energy = 9,
  Legend = 10,
}

export enum DamageType {
  Physical = 0,
  Cryo = 1,
  Hydro = 2,
  Pyro = 3,
  Electro = 4,
  Anemo = 5,
  Geo = 6,
  Dendro = 7,
  Piercing = 8,
  Heal = 9,
}

export enum Aura {
  None = 0,
  Cryo = 1,
  Hydro = 2,
  Pyro = 3,
  Electro = 4,
  Dendro = 7,
  CryoDendro = 113, // Aura.Cryo | (Aura.Dendro << 4)
}

export enum Reaction {
  Melt = 101,
  Vaporize = 102,
  Overloaded = 103,
  Superconduct = 104,
  ElectroCharged = 105,
  Frozen = 106,
  SwirlCryo = 107,
  SwirlHydro = 108,
  SwirlPyro = 109,
  SwirlElectro = 110,
  CrystallizeCryo = 111,
  CrystallizeHydro = 112,
  CrystallizePyro = 113,
  CrystallizeElectro = 114,
  Burning = 115,
  Bloom = 116,
  Quicken = 117,
}
