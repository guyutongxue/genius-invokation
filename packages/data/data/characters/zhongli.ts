
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
  DamageType,
  Target,
  SkillContext,
  IStatus,
  Status,
  ISummon,
  Summon,
  ShieldStatus,
} from "@jenshin-tcg";

@Character({
  objectId: 1603,
  health: 10,
  energy: 3,
  tags: ["geo", "pole", "liyue"],
})
class Zhongli {
  
  @Normal
  @Geo(1)
  @Void(2)
  rainOfStone(c: Context) {
    c.dealDamage(2, DamageType.PHYSICAL);
  }
  
  @Skill
  @Geo(3)
  dominusLapidis(c: Context) {
    c.dealDamage(1, DamageType.GEO);
    c.summon(StoneStele);
  }
  
  @Skill
  @Geo(5)
  dominusLapidisStrikingStone(c: Context) {
    c.dealDamage(3, DamageType.GEO);
    c.summon(StoneStele);
    c.createCombatStatus(JadeShield);
  }
  
  @Burst
  @Geo(3)
  @Energy(3)
  planetBefall(c: Context) {
    c.dealDamage(4, DamageType.GEO);
    c.createStatus(Petrification, [], Target.OPP | Target.ACTIVE);
  }
}

@Summon({
  objectId: 116031,
  usage: 2
})
class StoneStele implements ISummon {
  onEndPhase(c: Context) {
    c.dealDamage(1, DamageType.GEO);
    return true;
  }
}

@ShieldStatus({
  objectId: 116032,
  // initialShield: 2,
})
class JadeShield {}

@Status({
  objectId: 116033,
  duration: 1
})
class Petrification implements IStatus {
  onBeforeUseSkill(c: SkillContext) {
    c.disableSkill();
  }
}

register(Zhongli);
