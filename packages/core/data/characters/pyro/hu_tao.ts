import { character, skill, status, card, DamageType } from "@gi-tcg";

/**
 * @id 113072
 * @name 血梅香
 * @description
 * 结束阶段：对所附属角色造成1点火元素伤害。
 * 可用次数：1
 */
const BloodBlossom = status(113072)
  // TODO
  .done();

/**
 * @id 113071
 * @name 彼岸蝶舞
 * @description
 * 所附属角色造成的物理伤害变为火元素伤害，且角色造成的火元素伤害+1。
 * 所附属角色进行重击时：目标角色附属血梅香。
 * 持续回合：2
 */
const ParamitaPapilio = status(113071)
  // TODO
  .done();

/**
 * @id 13071
 * @name 往生秘传枪法
 * @description
 * 造成2点物理伤害。
 */
const SecretSpearOfWangsheng = skill(13071)
  .type("normal")
  .costPyro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 13072
 * @name 蝶引来生
 * @description
 * 本角色附属彼岸蝶舞。
 */
const GuideToAfterlife = skill(13072)
  .type("elemental")
  .costPyro(2)
  // TODO
  .done();

/**
 * @id 13073
 * @name 安神秘法
 * @description
 * 造成4点火元素伤害，治疗自身2点。如果本角色生命值不多于6，则造成的伤害和治疗各+1。
 */
const SpiritSoother = skill(13073)
  .type("burst")
  .costPyro(3)
  .costEnergy(3)
  // TODO
  .done();

/**
 * @id 1307
 * @name 胡桃
 * @description
 * 「送走，全送走。」
 */
const HuTao = character(1307)
  .tags("pyro", "pole", "liyue")
  .skills(SecretSpearOfWangsheng, GuideToAfterlife, SpiritSoother)
  .done();

/**
 * @id 213071
 * @name 血之灶火
 * @description
 * 战斗行动：我方出战角色为胡桃时，装备此牌。
 * 胡桃装备此牌后，立刻使用一次蝶引来生。
 * 装备有此牌的胡桃在生命值不多于6时：造成的火元素伤害+1。
 * （牌组中包含胡桃，才能加入牌组）
 */
const SanguineRouge = card(213071, "character")
  .costPyro(2)
  .talentOf(HuTao)
  .equipment()
  // TODO
  .done();
