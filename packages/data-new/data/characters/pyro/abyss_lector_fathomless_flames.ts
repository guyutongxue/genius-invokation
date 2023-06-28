import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **拯救之焰**
 * 造成1点火元素伤害。
 */
const FlameOfSalvation = createSkill(23021)
  .setType("normal")
  .costPyro(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **炽烈箴言**
 * 造成3点火元素伤害。
 */
const SearingPrecept = createSkill(23022)
  .setType("elemental")
  .costPyro(3)
  // TODO
  .build();

/**
 * **天陨预兆**
 * 造成3点火元素伤害，召唤黯火炉心。
 */
const OminousStar = createSkill(23023)
  .setType("burst")
  .costPyro(4)
  .costEnergy(2)
  // TODO
  .build();

/**
 * **火之新生**
 * 【被动】战斗开始时，初始附属火之新生。
 */
const FieryRebirth = createSkill(23024)
  .setType("passive")
  
  // TODO
  .build();

export const AbyssLectorFathomlessFlames = createCharacter(2302)
  .addTags("pyro", "monster")
  .addSkills(FlameOfSalvation, SearingPrecept, OminousStar, FieryRebirth)
  .build();

/**
 * **烬火重燃**
 * 入场时：如果装备有此牌的深渊咏者·渊火已触发过火之新生，就立刻弃置此牌，为角色附属渊火加护。
 * 装备有此牌的深渊咏者·渊火触发火之新生时：弃置此牌，为角色附属渊火加护。
 * （牌组中包含深渊咏者·渊火，才能加入牌组）
 */
export const EmbersRekindled = createCard(223021, ["character"])
  .setType("equipment")
  .addTags("talent")
  .costPyro(2)
  // TODO
  .build();
