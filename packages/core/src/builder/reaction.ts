import {
  Reaction as R,
  Aura as A,
  DamageType as D,
  DamageType,
} from "@gi-tcg/typings";
import { DamageInfo, DamageModifier1, SkillDescription } from "../base/skill";
import { SkillBuilder, enableShortcut } from "./skill";
import { ExtendedSkillContext } from "./context";
import { status, combatStatus, summon } from "./entity";
import { CombatStatusHandle, StatusHandle, SummonHandle } from "./type";

export type NontrivialDamageType = Exclude<D, D.Physical | D.Piercing | D.Heal>;

export type ReactionMap = Record<A, Record<NontrivialDamageType, [A, R | null]>>;

export const REACTION_MAP: ReactionMap = {
  [A.None]: {
    [D.Cryo]: [A.Cryo, null],
    [D.Hydro]: [A.Hydro, null],
    [D.Pyro]: [A.Pyro, null],
    [D.Electro]: [A.Electro, null],
    [D.Anemo]: [A.None, null],
    [D.Geo]: [A.None, null],
    [D.Dendro]: [A.Dendro, null],
  },
  [A.Cryo]: {
    [D.Cryo]: [A.Cryo, null],
    [D.Hydro]: [A.None, R.Frozen],
    [D.Pyro]: [A.None, R.Melt],
    [D.Electro]: [A.None, R.Superconduct],
    [D.Anemo]: [A.None, R.SwirlCryo],
    [D.Geo]: [A.None, R.CrystallizeCryo],
    [D.Dendro]: [A.CryoDendro, null],
  },
  [A.Hydro]: {
    [D.Cryo]: [A.None, R.Frozen],
    [D.Hydro]: [A.Hydro, null],
    [D.Pyro]: [A.None, R.Vaporize],
    [D.Electro]: [A.None, R.ElectroCharged],
    [D.Anemo]: [A.None, R.SwirlHydro],
    [D.Geo]: [A.None, R.CrystallizeHydro],
    [D.Dendro]: [A.None, R.Bloom],
  },
  [A.Pyro]: {
    [D.Cryo]: [A.None, R.Melt],
    [D.Hydro]: [A.None, R.Vaporize],
    [D.Pyro]: [A.Pyro, null],
    [D.Electro]: [A.None, R.Overloaded],
    [D.Anemo]: [A.None, R.SwirlPyro],
    [D.Geo]: [A.None, R.CrystallizePyro],
    [D.Dendro]: [A.None, R.Burning],
  },
  [A.Electro]: {
    [D.Cryo]: [A.None, R.Superconduct],
    [D.Hydro]: [A.None, R.ElectroCharged],
    [D.Pyro]: [A.None, R.Overloaded],
    [D.Electro]: [A.Electro, null],
    [D.Anemo]: [A.None, R.SwirlElectro],
    [D.Geo]: [A.None, R.CrystallizeElectro],
    [D.Dendro]: [A.None, R.Quicken],
  },
  [A.Dendro]: {
    [D.Cryo]: [A.CryoDendro, null],
    [D.Hydro]: [A.None, R.Bloom],
    [D.Pyro]: [A.None, R.Burning],
    [D.Electro]: [A.None, R.Quicken],
    [D.Anemo]: [A.Dendro, null],
    [D.Geo]: [A.Dendro, null],
    [D.Dendro]: [A.Dendro, null],
  },
  [A.CryoDendro]: {
    [D.Cryo]: [A.CryoDendro, null],
    [D.Hydro]: [A.Dendro, R.Frozen],
    [D.Pyro]: [A.Dendro, R.Melt],
    [D.Electro]: [A.Dendro, R.Superconduct],
    [D.Anemo]: [A.Dendro, R.SwirlCryo],
    [D.Geo]: [A.Dendro, R.CrystallizeCryo],
    [D.Dendro]: [A.CryoDendro, null],
  },
};

const Frozen = 106 as StatusHandle;
const Crystallize = 111 as CombatStatusHandle;
const BurningFlame = 115 as SummonHandle;
const DendroCore = 116 as CombatStatusHandle;
const CatalyzingField = 117 as CombatStatusHandle;

type DamageModifierR = Omit<DamageModifier1, "damageInfo"> & {
  damageInfo?: DamageInfo;
};

type ReactionDescription = SkillDescription<DamageModifierR>;
export const REACTION_DESCRIPTION: Record<R, ReactionDescription> = {} as any;

class ReactionBuilder extends SkillBuilder<DamageModifierR, "character"> {
  constructor(private reaction: R) {
    super("character", reaction);
  }

  done() {
    REACTION_DESCRIPTION[this.reaction] = (st, id, d) => {
      const action = this.getAction(() => d);
      return action(st, id);
    };
  }
}

function reaction(reaction: R) {
  return enableShortcut(new ReactionBuilder(reaction));
}

type ReactionAction = (
  c: ExtendedSkillContext<false, DamageModifierR, "character">,
) => void;

const pierceToOther: ReactionAction = (c) => {
  if (c.damageInfo) {
    c.increaseDamage(1);
    c.damage(1, D.Piercing, (c) =>
      c.$$(`my character not @self`),
    );
  }
};

const crystallize: ReactionAction = (c) => {
  c.increaseDamage(1);
  c.combatStatus(Crystallize);
};

const swirl = (srcElement: D): ReactionAction => {
  return (c) => {
    if (c.damageInfo) {
      c.damage(1, srcElement, (c) =>
        c.$$(`my character not @self`),
      );
    }
  };
};

reaction(R.Melt)
  .if((c) => !!c.damageInfo)
  .increaseDamage(2)
  .done();

reaction(R.Vaporize)
  .if((c) => !!c.damageInfo)
  .increaseDamage(2)
  .done();

reaction(R.Overloaded)
  .if((c) => c.$$(`@self and active`).length > 0)
  .switchActive("next")
  .done();

reaction(R.Superconduct)
  .do(pierceToOther) //
  .done();

reaction(R.ElectroCharged)
  .do(pierceToOther) //
  .done();

reaction(R.Frozen)
  .if((c) => !!c.damageInfo)
  .increaseDamage(1)
  .characterStatus(Frozen)
  .done();

reaction(R.SwirlCryo).do(swirl(D.Cryo)).done();

reaction(R.SwirlHydro).do(swirl(D.Hydro)).done();

reaction(R.SwirlPyro).do(swirl(D.Pyro)).done();

reaction(R.SwirlElectro).do(swirl(D.Electro)).done();

reaction(R.CrystallizeCryo).do(crystallize).done();

reaction(R.CrystallizeHydro).do(crystallize).done();

reaction(R.CrystallizePyro).do(crystallize).done();

reaction(R.CrystallizeElectro).do(crystallize).done();

reaction(R.Burning)
  .if((c) => !!c.damageInfo)
  .increaseDamage(1)
  .summon(BurningFlame)
  .done();

reaction(R.Bloom)
  .if((c) => !!c.damageInfo)
  .increaseDamage(1)
  // Nilou
  .if((c) => !!c.$$(`combat status with id 0`).length)
  .combatStatus(DendroCore);

reaction(R.Quicken)
  .if((c) => !!c.damageInfo)
  .combatStatus(CatalyzingField);
