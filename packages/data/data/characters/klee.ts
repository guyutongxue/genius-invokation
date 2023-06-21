import {
  Context,
  IStatus,
  SkillContext,
  Character,
  Void,
  Pyro,
  Normal,
  Skill,
  Burst,
  Status,
  DamageType,
  Target,
  register,
  Energy,
} from "@jenshin-tcg";

@Character({
  objectId: 1306,
  health: 10,
  energy: 3,
  tags: ["pyro", "catalyst", "mondstadt"],
})
class Klee {
  @Normal
  @Pyro(1)
  @Void(2)
  kaboom(c: Context) {
    c.dealDamage(1, DamageType.PYRO);
  }

  @Skill
  @Pyro(3)
  jumpyDumpty(c: Context) {
    c.dealDamage(3, DamageType.PYRO);
    c.createStatus(ExplosiveSpark);
  }

  @Burst
  @Pyro(3)
  @Energy(3)
  sparksNSplash(c: Context) {
    c.dealDamage(3, DamageType.PYRO);
    c.createCombatStatus(SparksNSplash, [], Target.OPP);
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
    c.dealDamage(2, DamageType.PYRO, Target.ME | Target.ACTIVE);
    return true;
  }
}

register(Klee, ExplosiveSpark, SparksNSplash);
