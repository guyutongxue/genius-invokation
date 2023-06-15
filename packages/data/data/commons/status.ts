import {
  DamageContext,
  DamageType,
  IStatus,
  SkillContext,
  Status,
  register,
} from "@jenshin-tcg";

@Status({
  objectId: 1002,
})
export class Infusion implements IStatus {
  constructor(readonly type: DamageType, readonly additionalDamage = 0) {}

  onBeforeUseSkill(c: SkillContext) {
    if (c.damage && c.damage.damageType === DamageType.PHYSICAL) {
      c.damage.changeDamageType(this.type);
      if (this.additionalDamage) {
        c.damage.addDamage(this.additionalDamage);
      }
    }
  }
}

@Status({
  objectId: 117,
  usage: 2,
})
export class InspirationField implements IStatus {
  onBeforeDealDamage(c: DamageContext) {
    if (
      c.target.isActive() &&
      (c.damageType === DamageType.ELECTRO || c.damageType == DamageType.DENDRO)
    ) {
      c.addDamage(2);
      return true;
    }
    return false;
  }
}

register(Infusion, InspirationField);
