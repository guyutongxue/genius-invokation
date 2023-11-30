import { character, skill, summon, status, card, DamageType } from "@gi-tcg";

/**
 * @id 117022
 * @name 藏蕴花矢
 * @description
 * 结束阶段：造成1点草元素伤害。
 * 可用次数：1（可叠加，最多叠加到2次）
 */
const ClusterbloomArrow = summon(117022)
  // TODO
  .done();

/**
 * @id 117021
 * @name 通塞识
 * @description
 * 所附属角色进行重击时：造成的物理伤害变为草元素伤害，并且会在技能结算后召唤藏蕴花矢。
 * 可用次数：2
 */
const VijnanaSuffusion = status(117021)
  // TODO
  .done();

/**
 * @id 17021
 * @name 藏蕴破障
 * @description
 * 造成2点物理伤害。
 */
const KhandaBarrierbuster = skill(17021)
  .type("normal")
  .costDendro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 17022
 * @name 识果种雷
 * @description
 * 造成2点草元素伤害，本角色附属通塞识。
 */
const VijnanaphalaMine = skill(17022)
  .type("elemental")
  .costDendro(3)
  // TODO
  .done();

/**
 * @id 17023
 * @name 造生缠藤箭
 * @description
 * 造成4点草元素伤害，对所有敌方后台角色造成1点穿透伤害。
 */
const FashionersTanglevineShaft = skill(17023)
  .type("burst")
  .costDendro(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 1702
 * @name 提纳里
 * @description
 * 从某种角度来说，经验并不等同于智慧。
 */
const Tighnari = character(1702)
  .tags("dendro", "bow", "sumeru")
  .skills(KhandaBarrierbuster, VijnanaphalaMine, FashionersTanglevineShaft)
  .done();

/**
 * @id 217021
 * @name 眼识殊明
 * @description
 * 战斗行动：我方出战角色为提纳里时，装备此牌。
 * 提纳里装备此牌后，立刻使用一次识果种雷。
 * 装备有此牌的提纳里在附属通塞识状态期间，进行重击时少花费1个无色元素。
 * （牌组中包含提纳里，才能加入牌组）
 */
const KeenSight = card(217021, "character")
  .costDendro(4)
  .talentOf(Tighnari)
  .equipment()
  // TODO
  .done();
