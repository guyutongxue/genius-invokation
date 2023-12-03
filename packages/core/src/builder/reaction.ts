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

type NontrivialDamage = Exclude<D, D.Physical | D.Piercing | D.Heal>;

export type ReactionMap = Record<A, Record<NontrivialDamage, [A, R | null]>>;

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

type DamageModifierR = Omit<DamageModifier1, "damageInfo"> & {
  damageInfo?: DamageInfo;
};

class ReactionBuilder extends SkillBuilder<DamageModifierR, "character"> {
  constructor(private reaction: R) {
    super("character", reaction);
  }

  done() {
    // const action: SkillDescription<> = this.getAction()
  }
}

function reaction(reaction: R) {
  return enableShortcut(new ReactionBuilder(reaction));
}

const Frozen = status(106)
  .duration(1)
  .tags("disableSkill")
  .on("beforeDamaged")
  .if((c) => c.damageInfo.type === D.Pyro || c.damageInfo.type === D.Physical)
  .do((c) => {
    c.increaseDamage(1);
    c.self().dispose();
  })
  .done();

const Crystallize = combatStatus(111)
  .shield(1, 2) //
  .done();

const BurningFlame = summon(115)
  .usage(1, 2)
  .on("endPhase")
  .damage(1, DamageType.Pyro)
  .done();

const DendroCore = combatStatus(116)
  .usage(1)
  .on("beforeDealDamage")
  .if(
    (c) =>
      [D.Pyro, D.Electro].includes(c.damageInfo.type) &&
      c.damageInfo.target.id === c.query("character").opp().active().one().id,
  )
  .increaseDamage(1)
  .done();

const CatalyzingField = combatStatus(117)
  .usage(2)
  .on("beforeDealDamage")
  .if(
    (c) =>
      [D.Electro, D.Dendro].includes(c.damageInfo.type) &&
      c.damageInfo.target.id === c.query("character").opp().active().one().id,
  )
  .increaseDamage(1)
  .done();

type ReactionAction = (
  c: ExtendedSkillContext<false, DamageModifierR, "character">,
) => void;

const pierceToOther: ReactionAction = (c) => {
  if (c.damageInfo) {
    c.increaseDamage(1);
    c.damage(1, D.Piercing, ($) => $.character().notId(c.self().id));
  }
};

const crystallize: ReactionAction = (c) => {
  c.increaseDamage(1);
  c.combatStatus(Crystallize);
};

const swirl = (srcElement: D): ReactionAction => {
  return (c) => {
    if (c.damageInfo) {
      c.damage(1, srcElement, ($) => $.character().notId(c.self().id));
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
  .if((c) => c.self().isActive())
  .switchActive(($) => $.next())
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
  .if(
    (c) =>
      !!c
        .query("combatStatus")
        .def(0 as any)
        .many().length,
  )
  .combatStatus(DendroCore);

reaction(R.Quicken)
  .if((c) => !!c.damageInfo)
  .combatStatus(CatalyzingField);

type ReactionDescription = SkillDescription<DamageInfo | null>;
