import { character, skill, DamageType } from "@gi-tcg";

const TestSkill = skill(10011)
  .do((c) => {
    c.damage(1, DamageType.Physical);
  })
  .build()

const TestCharacter = character(1001)
  .tags("cryo", "mondstadt", "sword")
  .skills(TestSkill)
  .build()
