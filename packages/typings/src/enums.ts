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

export enum DiceType {
  Void = 0,
  Cryo = 1,
  Hydro,
  Pyro,
  Electro,
  Anemo,
  Geo,
  Dendro,
  Omni = 8,
  Same = 8,
  Energy = 9
}

export enum DamageType {
  Physical = 0,
  Cryo,
  Hydro,
  Pyro,
  Electro,
  Anemo,
  Geo,
  Dendro,
  Piercing = 8,
  Heal = 9,
  // Revive = 10,
}

export enum Aura {
  None = 0,
  Cryo = 1,
  Hydro = 2,
  Pyro = 3,
  Electro = 4,
  Dendro = 7,
  CryoDendro = Aura.Cryo | (Aura.Dendro << 4)
}

export enum Reaction {
  Melt = 101,
  Vaporize,
  Overloaded,
  Superconduct,
  ElectroCharged,
  Frozen,
  SwirlCryo,
  SwirlHydro,
  SwirlPyro,
  SwirlElectro,
  CrystallizeCryo,
  CrystallizeHydro,
  CrystallizePyro,
  CrystallizeElectro,
  Burning,
  Bloom,
  Quicken
}
