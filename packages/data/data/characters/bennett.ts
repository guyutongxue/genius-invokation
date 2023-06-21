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
  register,
  DamageType,
  Target,
  Energy,
} from "@jenshin-tcg";

@Character({
  objectId: 1303,
  health: 10,
  energy: 3,
  tags: ["pyro", "sword", "mondstadt"]
})
class Bennett {
  @Normal
  @Pyro(1)
  @Void(2)
  strikeOfFortune(c: Context) {
    c.dealDamage(2, DamageType.PHYSICAL);
  }

  @Skill
  @Pyro(3)
  passionOverload(c: Context) {
    c.dealDamage(3, DamageType.PYRO);
  }

  @Burst
  @Pyro(3)
  @Energy(3)
  fantasticVoyage(c: Context) {
    c.dealDamage(2, DamageType.PYRO);
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
      if (c.damage) c.damage.addDamage(2);
      return true;
    }
  }
  onUseSkill(c: SkillContext) {
    if (c.character.getHealth() <= 6) {
      c.heal(2);
      return true;
    }
  }
}

register(Bennett, InspirationField);
