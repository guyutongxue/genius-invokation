import { character, skill, summon, status, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 112062
 * @name 清净之园囿
 * @description
 * 结束阶段：造成2点水元素伤害。
 * 可用次数：2
 * 此召唤物在场时：我方角色「普通攻击」造成的伤害+1。
 */
const GardenOfPurity = summon(112062)
  // TODO
  .done();

/**
 * @id 112061
 * @name 泷廻鉴花
 * @description
 * 所附属角色普通攻击造成的伤害+1，造成的物理伤害变为水元素伤害。
 * 可用次数：3
 */
const TakimeguriKanka = status(112061)
  // TODO
  .done();

/**
 * @id 12061
 * @name 神里流·转
 * @description
 * 造成2点物理伤害。
 */
const KamisatoArtMarobashi = skill(12061)
  .type("normal")
  .costHydro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 12062
 * @name 神里流·镜花
 * @description
 * 造成2点水元素伤害，本角色附属泷廻鉴花。
 */
const KamisatoArtKyouka = skill(12062)
  .type("elemental")
  .costHydro(3)
  // TODO
  .done();

/**
 * @id 12063
 * @name 神里流·水囿
 * @description
 * 造成1点水元素伤害，召唤清净之园囿。
 */
const KamisatoArtSuiyuu = skill(12063)
  .type("burst")
  .costHydro(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 1206
 * @name 神里绫人
 * @description
 * 神守之柏，已焕新材。
 */
const KamisatoAyato = character(1206)
  .tags("hydro", "sword", "inazuma")
  .skills(KamisatoArtMarobashi, KamisatoArtKyouka, KamisatoArtSuiyuu)
  .done();

/**
 * @id 212061
 * @name 镜华风姿
 * @description
 * 战斗行动：我方出战角色为神里绫人时，装备此牌。
 * 神里绫人装备此牌后，立刻使用一次神里流·镜花。
 * 装备有此牌的神里绫人触发泷廻鉴花的效果时：对于生命值不多于6的敌人伤害额外+1。
 * （牌组中包含神里绫人，才能加入牌组）
 */
const KyoukaFuushi = card(212061, "character")
  .costHydro(3)
  .talentOf(KamisatoAyato)
  .equipment()
  // TODO
  .done();
