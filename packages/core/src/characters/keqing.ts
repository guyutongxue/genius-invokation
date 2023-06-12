import { DamageTarget, DescriptionContext } from "../context";
import {
  Character,
  Any,
  Electro,
  Normal,
  Skill,
  Burst,
} from "../context/decorators";
import { DamageType } from "@jenshin-tcg/typings";

@Character({
  health: 10,
  energy: 3,
})
class Keqing {
  @Normal
  @Electro(1)
  @Any(2)
  yunlaiSwordsmanship(c: DescriptionContext) {
    c.damage(2, DamageType.PHYSICAL);
  }

  @Skill
  @Electro(3)
  stellarRestoration(c: DescriptionContext) {
    c.damage(3, DamageType.PYRO);
    // c.createCombatStatus()
  }

  @Burst
  @Electro(4)
  starwardSword(c: DescriptionContext) {
    c.damage(4, DamageType.PYRO);
    c.damage(3, DamageType.PIERCING, DamageTarget.STANDBY);
  }
}



export default Keqing;
