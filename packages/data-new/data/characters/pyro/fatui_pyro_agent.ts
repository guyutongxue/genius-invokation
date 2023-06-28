import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **突刺**
 * 造成2点物理伤害。
 */
const Thrust = createSkill(23011)
  .setType("normal")
  .costPyro(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **伺机而动**
 * 造成1点火元素伤害，本角色附属潜行。
 */
const Prowl = createSkill(23012)
  .setType("elemental")
  .costPyro(3)
  // TODO
  .build();

/**
 * **焚毁之锋**
 * 造成5点火元素伤害。
 */
const BladeAblaze = createSkill(23013)
  .setType("burst")
  .costPyro(3)
  .costEnergy(2)
  // TODO
  .build();

/**
 * **潜行大师**
 * 【被动】战斗开始时，初始附属潜行。
 */
const StealthMaster = createSkill(23014)
  .setType("passive")
  
  // TODO
  .build();

export const FatuiPyroAgent = createCharacter(2301)
  .addTags("pyro", "fatui")
  .addSkills(Thrust, Prowl, BladeAblaze, StealthMaster)
  .build();

/**
 * **悉数讨回**
 * 战斗行动：我方出战角色为愚人众·火之债务处理人时，装备此牌。
 * 愚人众·火之债务处理人装备此牌后，立刻使用一次伺机而动。
 * 装备有此牌的愚人众·火之债务处理人生成的潜行获得以下效果：
 * 初始可用次数+1，并且使所附属角色造成的物理伤害变为火元素伤害。
 * （牌组中包含愚人众·火之债务处理人，才能加入牌组）
 */
export const PaidInFull = createCard(223011, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .costPyro(3)
  // TODO
  .build();
