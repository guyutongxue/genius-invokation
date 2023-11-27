import { character, skill, summon, card, DamageType } from "@gi-tcg";

/**
 * @id 116041
 * @name 阳华
 * @description
 * 结束阶段：造成1点岩元素伤害。
 * 可用次数：3
 * 此召唤物在场时：我方角色进行下落攻击时少花费1个无色元素。（每回合1次）
 */
const SolarIsotoma = summon(116041)
  // TODO
  .done();

/**
 * @id 16041
 * @name 西风剑术·白
 * @description
 * 造成2点物理伤害。
 */
const FavoniusBladeworkWeiss = skill(16041)
  .type("normal")
  .costGeo(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 16042
 * @name 创生法·拟造阳华
 * @description
 * 召唤阳华。
 */
const AbiogenesisSolarIsotoma = skill(16042)
  .type("elemental")
  .costGeo(3)
  // TODO
  .done();

/**
 * @id 16043
 * @name 诞生式·大地之潮
 * @description
 * 造成4点岩元素伤害，如果阳华在场，就使此伤害+2。
 */
const RiteOfProgenitureTectonicTide = skill(16043)
  .type("burst")
  .costGeo(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 1604
 * @name 阿贝多
 * @description
 * 黑土与白垩，赤成与黄金。
 */
const Albedo = character(1604)
  .tags("geo", "sword", "mondstadt")
  .skills(FavoniusBladeworkWeiss, AbiogenesisSolarIsotoma, RiteOfProgenitureTectonicTide)
  .done();

/**
 * @id 216041
 * @name 神性之陨
 * @description
 * 战斗行动：我方出战角色为阿贝多时，装备此牌。
 * 阿贝多装备此牌后，立刻使用一次创生法·拟造阳华。
 * 装备有此牌的阿贝多在场时，如果我方场上存在阳华，则我方角色进行下落攻击时造成的伤害+1。
 * （牌组中包含阿贝多，才能加入牌组）
 */
const DescentOfDivinity = card(216041, "character")
  .costGeo(3)
  .talentOf(Albedo)
  .equipment()
  // TODO
  .done();
