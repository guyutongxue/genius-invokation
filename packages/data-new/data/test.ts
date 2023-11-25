import { character, skill, DamageType, card } from "@gi-tcg";
import { getCardDefinition, getCharacterDefinition, getSkillDefinition } from "../src/registry";
import { GameState, PlayerState } from "../src/base/state";
import { InitiativeSkillDefinition } from "../src/base/skill";

const TestSkill = skill(10011)
  .damage(1, DamageType.Piercing, $ => $.opp().standby())
  .damage(3, DamageType.Cryo)
  .heal(1, $ => $.self())
  // .if((c) => {
  //   c.query("character").one();
  // })
  .done();

// const TestSkill = skill(10012)
//   .apply(DamageType.Hydro, $ => $.self())
//   .done();
const TestCard = card(20011, ["character"])
  .costVoid(2)
  .heal(1, $ => $.context.targets[0])
  .done();

// const TestStatus = status(114053)
//   .duration(2)
//   .on("useSkill")
//   .if((c) => c.definition.type === "normal")
//   .damage(1, DamageType.Electro)
//   .on("beforeDamaged")
//   .if((c) => c.value >= 3)
//   .decreaseDamage(1)
//   .done()

// const TestStatus2 = status(123456)
//   .variable("testVar", 0)
//   .on("useSkill")
//   .damage(1, DamageType.Piercing, $ => $.self().master())
//   .if((c) => c.definition.type === "burst")
//   .do((c) => c.variables.testVar += 1)
//   .done()

const TestCharacter = character(1001)
  .tags("cryo", "mondstadt", "sword")
  .skills(TestSkill)
  .done();

