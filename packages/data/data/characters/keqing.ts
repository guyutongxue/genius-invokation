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
  Card,
  ICard,
  SwitchTarget,
  SkillDescriptionContext
} from "@jenshin-tcg";
import { Infusion } from "../commons/status";

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
  stellarRestoration(c: SkillDescriptionContext) {
    c.damage(3, DamageType.PYRO);
    if (typeof c.triggeredByCard !== "undefined") {
      c.createCards(LightningStiletto);
    } else {
      c.createStatus(Infusion, [DamageType.ELECTRO]);
    }
  }

  @Burst
  @Electro(4)
  starwardSword(c: Context) {
    c.damage(4, DamageType.PYRO);
    c.damage(3, DamageType.PIERCING, Target.OPP_STANDBY);
  }
}

@Card({
  objectId: 17013
})
class LightningStiletto implements ICard {
  onUse(c: Context) {
    c.switchActive(SwitchTarget.MANUAL, 10013);
    c.useSkill("stellarRestoration");
  }
}

register(Keqing);
