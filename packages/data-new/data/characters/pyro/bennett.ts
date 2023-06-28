import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **好运剑**
 * 造成2点物理伤害。
 */
const StrikeOfFortune = createSkill(13031)
  .setType("normal")
  .costPyro(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **热情过载**
 * 造成3点火元素伤害。
 */
const PassionOverload = createSkill(13032)
  .setType("elemental")
  .costPyro(3)
  // TODO
  .build();

/**
 * **美妙旅程**
 * 造成2点火元素伤害，生成鼓舞领域。
 */
const FantasticVoyage = createSkill(13033)
  .setType("burst")
  .costPyro(4)
  .costEnergy(2)
  // TODO
  .build();

export const Bennett = createCharacter(1303)
  .addTags("pyro", "sword", "mondstadt")
  .addSkills(StrikeOfFortune, PassionOverload, FantasticVoyage)
  .build();

/**
 * **冒险憧憬**
 * 战斗行动：我方出战角色为班尼特时，装备此牌。
 * 班尼特装备此牌后，立刻使用一次美妙旅程。
 * 装备有此牌的班尼特生成的鼓舞领域，其伤害提升效果改为总是生效，不再具有生命值限制。
 * （牌组中包含班尼特，才能加入牌组）
 */
export const GrandExpectation = createCard(213031, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .costPyro(4)
  .costEnergy(2)
  // TODO
  .build();
