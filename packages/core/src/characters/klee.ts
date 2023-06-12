import { DescriptionContext, IStatus, SkillContext } from "../context";
import {
  Character,
  Any,
  Pyro,
  Normal,
  Skill,
  Burst,
  CombatStatus,
  Status,
} from "../context/decorators";
import { DamageType } from "@jenshin-tcg/typings";

@Character({
  health: 10,
  energy: 3,
})
class Klee {
  @Normal
  @Pyro(1)
  @Any(2)
  strikeOfFortune(c: DescriptionContext) {
    c.damage(1, DamageType.PYRO);
  }

  @Skill
  @Pyro(3)
  passionOverload(c: DescriptionContext) {
    c.damage(3, DamageType.PYRO);
    c.createStatus(ExplosiveSpark);
  }

  @Burst
  @Pyro(3)
  fantasticVoyage(c: DescriptionContext) {
    c.damage(3, DamageType.PYRO);
    c.createCombatStatus(SparksNSplash, true);
  }
}

@Status({
  usage: 1,
})
class ExplosiveSpark implements IStatus {
  // modifyDice(c: DiceContext) {
  //   if (c.isCharged() && c.action.type === "normal" && c.action.character === Klee) {
  //     return [-1, DamageType.PYRO];
  //   }
  // }
}

@CombatStatus({
  usage: 2,
})
class SparksNSplash implements IStatus {
  onUseSkill(c: SkillContext) {
    // should be active character, but everything is OK now...
    c.character.damage(2, DamageType.PYRO);
  }
}

export default Klee;
