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

export enum PlayCardHint {
  DisposeSupport = 0,
  GeneralTarget = 1,
  GeneralTarget2 = 2,
  ArtifactSource,
  ArtifactDestination,
  WeaponSource,
  WeaponDestination,
}
