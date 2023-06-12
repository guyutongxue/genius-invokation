import { DescriptionContext } from "../context";
import {
  CharacterDefinition,
  Any,
  Energy,
  Pyro,
  Normal,
  Skill,
  Burst,
} from "../context/decorators";
import { DamageType } from "@jenshin-tcg/typings";

@CharacterDefinition({
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
  @Energy(3)
  fantasticVoyage(c: DescriptionContext) {
    c.damage(2, DamageType.PYRO);
    c.createCombatStatus({ id: 666, how: void 0 });
  }
}

export default Bennett;
