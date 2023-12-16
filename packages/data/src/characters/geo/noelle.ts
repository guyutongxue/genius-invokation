import { character, skill, status, combatStatus, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 116022
 * @name 大扫除
 * @description
 * 角色使用普通攻击时：少花费1个岩元素。（每回合1次）
 * 角色普通攻击造成的伤害+2，造成的物理伤害变为岩元素伤害。
 * 持续回合：2
 */
const SweepingTimeStatus = status(116022)
  // TODO
  .done();

/**
 * @id 116021
 * @name 护体岩铠
 * @description
 * 为我方出战角色提供2点护盾。
 * 此护盾耗尽前，我方受到的物理伤害减半。（向上取整）
 */
const FullPlate = combatStatus(116021)
  // TODO
  .done();

/**
 * @id 16021
 * @name 西风剑术·女仆
 * @description
 * 造成2点物理伤害。
 */
const FavoniusBladeworkMaid = skill(16021)
  .type("normal")
  .costGeo(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 16022
 * @name 护心铠
 * @description
 * 造成1点岩元素伤害，生成护体岩铠。
 */
const Breastplate = skill(16022)
  .type("elemental")
  .costGeo(3)
  // TODO
  .done();

/**
 * @id 16023
 * @name 大扫除
 * @description
 * 造成4点岩元素伤害，本角色附属大扫除。
 */
const SweepingTime = skill(16023)
  .type("burst")
  .costGeo(4)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 1602
 * @name 诺艾尔
 * @description
 * 整理牌桌这种事，真的可以交给她。
 */
const Noelle = character(1602)
  .tags("geo", "claymore", "mondstadt")
  .health(10)
  .energy(2)
  .skills(FavoniusBladeworkMaid, Breastplate, SweepingTime)
  .done();

/**
 * @id 216021
 * @name 支援就交给我吧
 * @description
 * 战斗行动：我方出战角色为诺艾尔时，装备此牌。
 * 诺艾尔装备此牌后，立刻使用一次护心铠。
 * 诺艾尔普通攻击后：如果此牌和护体岩铠仍在场，则治疗我方所有角色1点。（每回合1次）
 * （牌组中包含诺艾尔，才能加入牌组）
 */
const IGotYourBack = card(216021)
  .costGeo(3)
  .talentOf(Noelle)
  .equipment()
  // TODO
  .done();
