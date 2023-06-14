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
  register,
  DamageType,
  Target,
} from "@jenshin-tcg";

@Character({
  objectId: 10008,
  health: 10,
  energy: 3,
})
class Bennett {
  @Normal
  @Pyro(1)
  @Any(2)
  strikeOfFortune(c: Context) {
    c.damage(2, DamageType.PHYSICAL);
  }

  @Skill
  @Pyro(3)
  passionOverload(c: Context) {
    c.damage(3, DamageType.PYRO);
  }

  @Burst
  @Pyro(3)
  fantasticVoyage(c: Context) {
    c.damage(2, DamageType.PYRO);
    c.createCombatStatus(InspirationField);
  }
}

@Status({
  objectId: 70008,
  duration: 2,
})
class InspirationField implements IStatus {
  onBeforeUseSkill(c: SkillContext) {
    if (c.character.getHealth() <= 7) {
      c.addDamage(2);
    }
  }
  onUseSkill(c: SkillContext) {
    if (c.character.getHealth() <= 6) {
      c.damage(2, DamageType.HEAL, Target.MASTER);
    }
  }
}

register(Bennett, InspirationField);
