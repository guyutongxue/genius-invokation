import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **往生秘传枪法**
 * 造成2点物理伤害。
 */
const SecretSpearOfWangsheng = createSkill(13071)
  .setType("normal")
  .costPyro(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **蝶引来生**
 * 本角色附属彼岸蝶舞。
 */
const GuideToAfterlife = createSkill(13072)
  .setType("elemental")
  .costPyro(2)
  // TODO
  .build();

/**
 * **安神秘法**
 * 造成4点火元素伤害，治疗自身2点。如果本角色生命值不多于6，则造成的伤害和治疗各+1。
 */
const SpiritSoother = createSkill(13073)
  .setType("burst")
  .costPyro(3)
  .costEnergy(3)
  // TODO
  .build();

export const HuTao = createCharacter(1307)
  .addTags("pyro", "pole", "liyue")
  .addSkills(SecretSpearOfWangsheng, GuideToAfterlife, SpiritSoother)
  .build();

/**
 * **血之灶火**
 * 战斗行动：我方出战角色为胡桃时，装备此牌。
 * 胡桃装备此牌后，立刻使用一次蝶引来生。
 * 装备有此牌的胡桃在生命值不多于6时，造成的火元素伤害+1。
 * （牌组中包含胡桃，才能加入牌组）
 */
export const SanguineRouge = createCard(213071, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .costPyro(2)
  // TODO
  .build();
