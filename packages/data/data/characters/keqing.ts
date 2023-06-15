import {
  Target,
  Context,
  Character,
  Void,
  Electro,
  Normal,
  Skill,
  Burst,
  DamageType,
  register,
  Card,
  ICard,
  SkillDescriptionContext
} from "@jenshin-tcg";
import { Infusion } from "../commons/status";

@Character({
  objectId: 1403,
  health: 10,
  energy: 3,
  tags: ["electro", "sword", "liyue"]
})
class Keqing {
  @Normal
  @Electro(1)
  @Void(2)
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
    c.damage(3, DamageType.PIERCING, Target.STANDBY);
  }
}

@Card({
  objectId: 17013,
  type: "event",
  tags: ["action"]
})
class LightningStiletto implements ICard {
  onUse(c: Context) {
    c.switchActive(Target.OF_OBJ_ID(10013));
    c.useSkill("stellarRestoration");
  }
}

register(Keqing);
