
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
  DamageType,
  Passive,
  Status,
  IStatus,
  SkillContext,
  DamageContext,
  Target,
  SkillDescriptionContext,
} from "@jenshin-tcg";

@Character({
  objectId: 1204,
  health: 10,
  energy: 3,
  tags: ["hydro", "bow", "fatui"],
})
class Tartaglia {
  
  @Normal
  @Hydro(1)
  @Void(2)
  cuttingTorrent(c: Context) {
    c.dealDamage(2, DamageType.PHYSICAL);
  }
  
  @Skill
  @Hydro(3)
  foulLegacyRagingTide(c: Context) {
    c.removeStatus(RangedStance);
    c.createStatus(MeleeStance);
    c.dealDamage(2, DamageType.HYDRO);
  }
  
  @Burst
  @Hydro(3)
  @Energy(3)
  havocObliteration(c: SkillDescriptionContext) {
    if (c.character.hasStatus(RangedStance)) {
      c.dealDamage(4, DamageType.HYDRO);
      c.gainEnergy(2);
      c.createStatus(Riptide, [], Target.ACTIVE | Target.OPP);
    } else if (c.character.hasStatus(MeleeStance)) {
      c.dealDamage(7, DamageType.HYDRO);
    }
  }
  
  @Passive("tideWithholder")
  onBattleBegin(c: Context) {
    c.createStatus(RangedStance);
  }
}

@Status({
  objectId: 112041
})
class RangedStance implements IStatus {
  onUseSkill(c: SkillContext) {
    if (c.isCharged() && c.damage) {
      c.createStatus(Riptide, [], c.damage.target.toTarget());
    }
  }
}

@Status({
  objectId: 112042,
  duration: 2
})
class MeleeStance implements IStatus {
  piercingCount = 2;

  onDealDamage(c: DamageContext) {
    c.changeDamageType(DamageType.HYDRO);
  }

  onUseSkill(c: SkillContext) {
    if (c.isCharged() && c.damage) {
      c.createStatus(Riptide, [], c.damage.target.toTarget());
    }
    if (this.piercingCount && c.damage && c.damage.target.hasStatus(Riptide)) {
      c.dealDamage(1, DamageType.PIERCING, Target.NEXT | Target.OPP);
      this.piercingCount--;
    }
  }

  onDisposed(c: Context) {
    c.createStatus(RangedStance, []);
  }
}

@Status({
  objectId: 112043,
  duration: 2
})
class Riptide implements IStatus {
  onDamaged(c: Context) {
    c.createStatus(Riptide, [], Target.ACTIVE | Target.ME);
  }
}

register(Tartaglia);
