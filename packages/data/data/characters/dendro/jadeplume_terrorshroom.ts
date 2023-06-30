import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **菌王舞步**
 * 造成2点物理伤害。
 */
const MajesticDance = createSkill(27011)
  .setType("normal")
  .costDendro(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **不稳定孢子云**
 * 造成3点草元素伤害。
 */
const VolatileSporeCloud = createSkill(27012)
  .setType("elemental")
  .costDendro(3)
  // TODO
  .build();

/**
 * **尾羽豪放**
 * 造成4点草元素伤害，消耗所有活化激能层数，每层使此伤害+1。
 */
const FeatherSpreading = createSkill(27013)
  .setType("burst")
  .costDendro(3)
  .costEnergy(2)
  // TODO
  .build();

/**
 * **活化激能**
 * 【被动】战斗开始时，初始附属活化激能。
 */
const RadicalVitality = createSkill(27014)
  .setType("passive")
  // TODO
  .build();

export const JadeplumeTerrorshroom = createCharacter(2701)
  .addTags("dendro", "monster")
  .addSkills(MajesticDance, VolatileSporeCloud, FeatherSpreading, RadicalVitality)
  .build();

/**
 * **孢子增殖**
 * 战斗行动：我方出战角色为翠翎恐蕈时，装备此牌。
 * 翠翎恐蕈装备此牌后，立刻使用一次不稳定孢子云。
 * 装备有此牌的翠翎恐蕈，可累积的「活化激能」层数+1。
 * （牌组中包含翠翎恐蕈，才能加入牌组）
 */
export const ProliferatingSpores = createCard(227011, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .costDendro(3)
  // TODO
  .build();
