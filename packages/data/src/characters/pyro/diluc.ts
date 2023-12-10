import { character, skill, status, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 113011
 * @name 火元素附魔
 * @description
 * 所附属角色造成的物理伤害，变为火元素伤害。
 * 持续回合：2
 */
const PyroInfusion = status(113011)
  // TODO
  .done();

/**
 * @id 13011
 * @name 淬炼之剑
 * @description
 * 造成2点物理伤害。
 */
const TemperedSword = skill(13011)
  .type("normal")
  .costPyro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 13012
 * @name 逆焰之刃
 * @description
 * 造成3点火元素伤害。每回合第三次使用本技能时，伤害+2。
 */
const SearingOnslaught = skill(13012)
  .type("elemental")
  .costPyro(3)
  // TODO
  .done();

/**
 * @id 13013
 * @name 黎明
 * @description
 * 造成8点火元素伤害，本角色附属火元素附魔。
 */
const Dawn = skill(13013)
  .type("burst")
  .costPyro(4)
  .costEnergy(3)
  // TODO
  .done();

/**
 * @id 1301
 * @name 迪卢克
 * @description
 * 他的心是他最大的敌人。
 */
const Diluc = character(1301)
  .tags("pyro", "claymore", "mondstadt")
  .skills(TemperedSword, SearingOnslaught, Dawn)
  .done();

/**
 * @id 213011
 * @name 流火焦灼
 * @description
 * 战斗行动：我方出战角色为迪卢克时，装备此牌。
 * 迪卢克装备此牌后，立刻使用一次逆焰之刃。
 * 装备有此牌的迪卢克每回合第2次使用逆焰之刃时：少花费1个火元素。
 * （牌组中包含迪卢克，才能加入牌组）
 */
const FlowingFlame = card(213011)
  .costPyro(3)
  .talentOf(Diluc)
  .equipment()
  // TODO
  .done();
