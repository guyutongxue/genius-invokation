import {
  Target,
  Context,
  Character,
  Any,
  Electro,
  Normal,
  Skill,
  Burst,
  DamageType,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 10013,
  health: 10,
  energy: 3,
})
class Keqing {
  @Normal
  @Electro(1)
  @Any(2)
  yunlaiSwordsmanship(c: Context) {
    c.damage(2, DamageType.PHYSICAL);
  }

  @Skill
  @Electro(3)
  stellarRestoration(c: Context) {
    c.damage(3, DamageType.PYRO);
    // c.createCombatStatus()
  }

  @Burst
  @Electro(4)
  starwardSword(c: Context) {
    c.damage(4, DamageType.PYRO);
    c.damage(3, DamageType.PIERCING, Target.OPP_STANDBY);
  }
}

register(Keqing);
