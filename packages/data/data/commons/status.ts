import { DamageType, IStatus, SkillContext, Status, register } from "@jenshin-tcg";

@Status({
  objectId: 12000,
})
export class Infusion implements IStatus {

  constructor(readonly type: DamageType) { }

  onBeforeUseSkill(c: SkillContext) {
    if (c.damageType === DamageType.PHYSICAL) {
      c.changeDamageType(this.type);
    }
  }
}

register(Infusion);
