import {
  Context,
  IStatus,
  SkillContext,
  Character,
  Any,
  Pyro,
  Normal,
  Skill,
  Burst,
  Status,
  DamageType,
  Target,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 10032,
  health: 10,
  energy: 3,
})
class Klee {
  @Normal
  @Pyro(1)
  @Any(2)
  strikeOfFortune(c: Context) {
    c.damage(1, DamageType.PYRO);
  }

  @Skill
  @Pyro(3)
  passionOverload(c: Context) {
    c.damage(3, DamageType.PYRO);
    c.createStatus(ExplosiveSpark);
  }

  @Burst
  @Pyro(3)
  fantasticVoyage(c: Context) {
    c.damage(3, DamageType.PYRO);
    c.createCombatStatus(SparksNSplash, [], Target.OPP_ACTIVE);
  }
}

@Status({
  objectId: 70032,
  usage: 1,
})
class ExplosiveSpark implements IStatus {
  // modifyDice(c: DiceContext) {
  //   if (c.isCharged() && c.action.type === "normal" && c.action.character === Klee) {
  //     return [-1, DamageType.PYRO];
  //   }
  // }
}

@Status({
  objectId: 71032,
  usage: 2,
})
class SparksNSplash implements IStatus {
  onUseSkill(c: SkillContext) {
    c.damage(2, DamageType.PYRO, Target.MASTER_ACTIVE);
    return true;
  }
}

register(Klee, ExplosiveSpark, SparksNSplash);
