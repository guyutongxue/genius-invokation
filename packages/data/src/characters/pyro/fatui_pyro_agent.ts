import { character, skill, status, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 123012
 * @name 潜行
 * @description
 * 所附属角色受到的伤害-1，造成的伤害+1。
 * 可用次数：3
 * 所附属角色造成的物理伤害变为火元素伤害。
 */
const StealthStatus = status(123012)
  // TODO
  .done();

/**
 * @id 123011
 * @name 潜行
 * @description
 * 所附属角色受到的伤害-1，造成的伤害+1。
 * 可用次数：2
 */
const Stealth = status(123011)
  // TODO
  .done();

/**
 * @id 23011
 * @name 突刺
 * @description
 * 造成2点物理伤害。
 */
const Thrust = skill(23011)
  .type("normal")
  .costPyro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 23012
 * @name 伺机而动
 * @description
 * 造成1点火元素伤害，本角色附属潜行。
 */
const Prowl = skill(23012)
  .type("elemental")
  .costPyro(3)
  // TODO
  .done();

/**
 * @id 23013
 * @name 焚毁之锋
 * @description
 * 造成5点火元素伤害。
 */
const BladeAblaze = skill(23013)
  .type("burst")
  .costPyro(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 23014
 * @name 潜行大师
 * @description
 * 【被动】战斗开始时，初始附属潜行。
 */
const StealthMaster = skill(23014)
  .type("passive")
  // TODO
  .done();

/**
 * @id 2301
 * @name 愚人众·火之债务处理人
 * @description
 * 「死债不可免，活债更难逃…」
 */
const FatuiPyroAgent = character(2301)
  .tags("pyro", "fatui")
  .health(9)
  .energy(2)
  .skills(Thrust, Prowl, BladeAblaze, StealthMaster)
  .done();

/**
 * @id 223011
 * @name 悉数讨回
 * @description
 * 战斗行动：我方出战角色为愚人众·火之债务处理人时，装备此牌。
 * 愚人众·火之债务处理人装备此牌后，立刻使用一次伺机而动。
 * 装备有此牌的愚人众·火之债务处理人生成的潜行获得以下效果：
 * 初始可用次数+1，并且使所附属角色造成的物理伤害变为火元素伤害。
 * （牌组中包含愚人众·火之债务处理人，才能加入牌组）
 */
const PaidInFull = card(223011)
  .costPyro(3)
  .talent(FatuiPyroAgent)
  // TODO
  .done();
