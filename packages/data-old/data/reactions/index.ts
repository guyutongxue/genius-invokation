import { Aura, DamageType as Damage, Reaction } from "@gi-tcg";

type NontrivialDamage = Exclude<Damage, Damage.Physical | Damage.Piercing | Damage.Heal>;
export type ReactionMap = Record<Aura, Record<NontrivialDamage, [Aura, Reaction | null]>>

export const REACTION_MAP: ReactionMap = {
  [Aura.None]: {
    [Damage.Cryo]: [Aura.Cryo, null],
    [Damage.Hydro]: [Aura.Hydro, null],
    [Damage.Pyro]: [Aura.Pyro, null],
    [Damage.Electro]: [Aura.Electro, null],
    [Damage.Anemo]: [Aura.None, null],
    [Damage.Geo]: [Aura.None, null],
    [Damage.Dendro]: [Aura.Dendro, null],
  },
  [Aura.Cryo]: {
    [Damage.Cryo]: [Aura.Cryo, null],
    [Damage.Hydro]: [Aura.None, Reaction.Frozen],
    [Damage.Pyro]: [Aura.None, Reaction.Melt],
    [Damage.Electro]: [Aura.None, Reaction.Superconduct],
    [Damage.Anemo]: [Aura.None, Reaction.SwirlCryo],
    [Damage.Geo]: [Aura.None, Reaction.CrystallizeCryo],
    [Damage.Dendro]: [Aura.CryoDendro, null],
  },
  [Aura.Hydro]: {
    [Damage.Cryo]: [Aura.None, Reaction.Frozen],
    [Damage.Hydro]: [Aura.Hydro, null],
    [Damage.Pyro]: [Aura.None, Reaction.Vaporize],
    [Damage.Electro]: [Aura.None, Reaction.ElectroCharged],
    [Damage.Anemo]: [Aura.None, Reaction.SwirlHydro],
    [Damage.Geo]: [Aura.None, Reaction.CrystallizeHydro],
    [Damage.Dendro]: [Aura.None, Reaction.Bloom],
  },
  [Aura.Pyro]: {
    [Damage.Cryo]: [Aura.None, Reaction.Melt],
    [Damage.Hydro]: [Aura.None, Reaction.Vaporize],
    [Damage.Pyro]: [Aura.Pyro, null],
    [Damage.Electro]: [Aura.None, Reaction.Overloaded],
    [Damage.Anemo]: [Aura.None, Reaction.SwirlPyro],
    [Damage.Geo]: [Aura.None, Reaction.CrystallizePyro],
    [Damage.Dendro]: [Aura.None, Reaction.Burning],
  },
  [Aura.Electro]: {
    [Damage.Cryo]: [Aura.None, Reaction.Superconduct],
    [Damage.Hydro]: [Aura.None, Reaction.ElectroCharged],
    [Damage.Pyro]: [Aura.None, Reaction.Overloaded],
    [Damage.Electro]: [Aura.Electro, null],
    [Damage.Anemo]: [Aura.None, Reaction.SwirlElectro],
    [Damage.Geo]: [Aura.None, Reaction.CrystallizeElectro],
    [Damage.Dendro]: [Aura.None, Reaction.Quicken],
  },
  [Aura.Dendro]: {
    [Damage.Cryo]: [Aura.CryoDendro, null],
    [Damage.Hydro]: [Aura.None, Reaction.Bloom],
    [Damage.Pyro]: [Aura.None, Reaction.Burning],
    [Damage.Electro]: [Aura.None, Reaction.Quicken],
    [Damage.Anemo]: [Aura.Dendro, null],
    [Damage.Geo]: [Aura.Dendro, null],
    [Damage.Dendro]: [Aura.Dendro, null],
  },
  [Aura.CryoDendro]: {
    [Damage.Cryo]: [Aura.CryoDendro, null],
    [Damage.Hydro]: [Aura.Dendro, Reaction.Frozen],
    [Damage.Pyro]: [Aura.Dendro, Reaction.Melt],
    [Damage.Electro]: [Aura.Dendro, Reaction.Superconduct],
    [Damage.Anemo]: [Aura.Dendro, Reaction.SwirlCryo],
    [Damage.Geo]: [Aura.Dendro, Reaction.CrystallizeCryo],
    [Damage.Dendro]: [Aura.CryoDendro, null],
  }
}
