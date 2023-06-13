import { DescriptionContext, IStatus, SkillContext } from "../../context";
import {
  Character,
  Any,
  Pyro,
  Normal,
  Skill,
  Burst,
  CombatStatus,
} from "../../context/decorators";
import { DamageType } from "@jenshin-tcg/typings";

@Character({
  health: 10,
  energy: 3,
})
class Bennett {
  @Normal
  @Pyro(1)
  @Any(2)
  strikeOfFortune(c: DescriptionContext) {
    c.damage(2, DamageType.PHYSICAL);
  }

  @Skill
  @Pyro(3)
  passionOverload(c: DescriptionContext) {
    c.damage(3, DamageType.PYRO);
  }

  @Burst
  @Pyro(3)
  fantasticVoyage(c: DescriptionContext) {
    c.damage(2, DamageType.PYRO);
    c.createCombatStatus(InspirationField);
  }
}

@CombatStatus({
  duration: 2,
})
class InspirationField implements IStatus {
  onBeforeUseSkill(c: SkillContext) {
    if (c.character.health <= 7) {
      c.addDamage(2);
    }
  }
  onUseSkill(c: SkillContext) {
    if (c.character.health <= 6) {
      c.character.heal(2);
    }
  }
}

export default Bennett;
