import { character, skill, summon, combatStatus, card, DamageType } from "@gi-tcg";

/**
 * @id 113021
 * @name 锅巴
 * @description
 * 结束阶段：造成2点火元素伤害。
 * 可用次数：2
 */
const Guoba = summon(113021)
  // TODO
  .done();

/**
 * @id 113022
 * @name 旋火轮
 * @description
 * 我方角色使用技能后：造成2点火元素伤害。
 * 可用次数：2
 */
const Pyronado = combatStatus(113022)
  // TODO
  .done();

/**
 * @id 13021
 * @name 白案功夫
 * @description
 * 造成2点物理伤害。
 */
const DoughFu = skill(13021)
  .type("normal")
  .costPyro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 13022
 * @name 锅巴出击
 * @description
 * 召唤锅巴。
 */
const GuobaAttack = skill(13022)
  .type("elemental")
  .costPyro(3)
  // TODO
  .done();

/**
 * @id 13023
 * @name 旋火轮
 * @description
 * 造成3点火元素伤害，生成旋火轮。
 */
const Pyronado = skill(13023)
  .type("burst")
  .costPyro(4)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 1302
 * @name 香菱
 * @description
 * 身为一个厨师，她几乎什么都做得到。
 */
const Xiangling = character(1302)
  .tags("pyro", "pole", "liyue")
  .skills(DoughFu, GuobaAttack, Pyronado)
  .done();

/**
 * @id 213021
 * @name 交叉火力
 * @description
 * 战斗行动：我方出战角色为香菱时，装备此牌。
 * 香菱装备此牌后，立刻使用一次锅巴出击。
 * 装备有此牌的香菱使用锅巴出击时：自身也会造成1点火元素伤害。
 * （牌组中包含香菱，才能加入牌组）
 */
const Crossfire = card(213021, "character")
  .costPyro(3)
  .talentOf(Xiangling)
  .equipment()
  // TODO
  .done();
