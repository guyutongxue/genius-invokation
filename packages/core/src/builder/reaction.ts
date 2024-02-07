import { Reaction, DamageType } from "@gi-tcg/typings";
import {
  DamageInfo,
  ModifyDamage0EventArg,
  SkillDescription,
} from "../base/skill";
import { SkillBuilder, enableShortcut } from "./skill";
import { TypedSkillContext } from "./context";
import { CombatStatusHandle, StatusHandle, SummonHandle } from "./type";

export const CALLED_FROM_REACTION: unique symbol = Symbol();

const Frozen = 106 as StatusHandle;
const Crystallize = 111 as CombatStatusHandle;
const BurningFlame = 115 as SummonHandle;
const DendroCore = 116 as CombatStatusHandle;
const CatalyzingField = 117 as CombatStatusHandle;

type OptionalDamageModifyEventArg = ModifyDamage0EventArg<OptionalDamageInfo>;

export interface OptionalDamageInfo extends DamageInfo {
  isDamage: boolean;
}

type ReactionDescription = SkillDescription<OptionalDamageModifyEventArg>;
const REACTION_DESCRIPTION: Record<Reaction, ReactionDescription> = {} as any;

type ReactionContextMeta = {
  readonly: false;
  callerVars: never;
  eventArgType: OptionalDamageModifyEventArg;
  callerType: any;
};

class ReactionBuilder extends SkillBuilder<ReactionContextMeta> {
  constructor(private reaction: Reaction) {
    super(reaction);
  }

  done() {
    REACTION_DESCRIPTION[this.reaction] = (st, id, d) => {
      return this.getAction(d)(st, id);
    };
  }
}

function reaction(reaction: Reaction) {
  return enableShortcut(new ReactionBuilder(reaction));
}

type ReactionAction = (c: TypedSkillContext<ReactionContextMeta>) => void;

const pierceToOther =
  (reaction: Reaction): ReactionAction =>
  (c) => {
    if (c.eventArg.damageInfo.isDamage) {
      c.eventArg.increaseDamage(1);
      (c as any)[CALLED_FROM_REACTION] = reaction;
      c.damage(DamageType.Piercing, 1, "opp character and not @damage.target");
    }
  };

const crystallize: ReactionAction = (c) => {
  c.eventArg.increaseDamage(1);
  c.combatStatus(Crystallize);
};

const swirl = (srcElement: DamageType): ReactionAction => {
  return (c) => {
    (c as any)[CALLED_FROM_REACTION] = srcElement + 106;
    if (c.eventArg.damageInfo.isDamage) {
      c.damage(srcElement, 1, "opp character and not @damage.target");
    }
  };
};

function initialize() {
  reaction(Reaction.Melt)
    .if((c, e) => e.damageInfo.isDamage)
    .increaseDamage(2)
    .done();

  reaction(Reaction.Vaporize)
    .if((c, e) => e.damageInfo.isDamage)
    .increaseDamage(2)
    .done();

  reaction(Reaction.Overloaded)
    .if((c, e) => c.of(e.target).isActive())
    .switchActive("opp next")
    .done();

  reaction(Reaction.Superconduct)
    .do(pierceToOther(Reaction.Superconduct))
    .done();

  reaction(Reaction.ElectroCharged)
    .do(pierceToOther(Reaction.ElectroCharged))
    .done();

  reaction(Reaction.Frozen)
    .if((c, e) => e.damageInfo)
    .increaseDamage(1)
    .characterStatus(Frozen, "@damage.target")
    .done();

  reaction(Reaction.SwirlCryo).do(swirl(DamageType.Cryo)).done();

  reaction(Reaction.SwirlHydro).do(swirl(DamageType.Hydro)).done();

  reaction(Reaction.SwirlPyro).do(swirl(DamageType.Pyro)).done();

  reaction(Reaction.SwirlElectro).do(swirl(DamageType.Electro)).done();

  reaction(Reaction.CrystallizeCryo).do(crystallize).done();

  reaction(Reaction.CrystallizeHydro).do(crystallize).done();

  reaction(Reaction.CrystallizePyro).do(crystallize).done();

  reaction(Reaction.CrystallizeElectro).do(crystallize).done();

  reaction(Reaction.Burning)
    .if((c, e) => e.damageInfo.isDamage)
    .increaseDamage(1)
    .summon(BurningFlame)
    .done();

  reaction(Reaction.Bloom)
    .if((c, e) => e.damageInfo.isDamage)
    .increaseDamage(1)
    // Nilou
    .if((c) => c.$$(`combat status with definition id 112081`).length)
    .combatStatus(DendroCore)
    .done();

  reaction(Reaction.Quicken)
    .if((c, e) => e.damageInfo.isDamage)
    .increaseDamage(1)
    .combatStatus(CatalyzingField)
    .done();
}

let initialized = false;
export function getReactionDescription(reaction: Reaction) {
  if (!initialized) {
    initialized = true;
    initialize();
  }
  return REACTION_DESCRIPTION[reaction];
}
