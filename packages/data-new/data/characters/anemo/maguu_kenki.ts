import { character, skill, summon, status, card, DamageType } from "@gi-tcg";

/**
 * @id 125012
 * @name 剑影·霜驰
 * @description
 * 结束阶段：造成1点冰元素伤害。
 * 可用次数：2
 */
const ShadowswordGallopingFrost = summon(125012)
  // TODO
  .done();

/**
 * @id 125011
 * @name 剑影·孤风
 * @description
 * 结束阶段：造成1点风元素伤害。
 * 可用次数：2
 */
const ShadowswordLoneGale = summon(125011)
  // TODO
  .done();

/**
 * @id 125013
 * @name 凶面归位
 * @description
 * 结束阶段：切换到所附属角色。
 */
const TerrormasksReturn = status(125013)
  // TODO
  .done();

/**
 * @id 25011
 * @name 一文字
 * @description
 * 造成2点物理伤害。
 */
const Ichimonji = skill(25011)
  .type("normal")
  .costAnemo(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 25012
 * @name 孤风刀势
 * @description
 * 召唤剑影·孤风。
 */
const BlusteringBlade = skill(25012)
  .type("elemental")
  .costAnemo(3)
  // TODO
  .done();

/**
 * @id 25013
 * @name 霜驰影突
 * @description
 * 召唤剑影·霜驰。
 */
const FrostyAssault = skill(25013)
  .type("elemental")
  .costCryo(3)
  // TODO
  .done();

/**
 * @id 25014
 * @name 机巧伪天狗抄
 * @description
 * 造成4点风元素伤害，触发所有我方剑影召唤物的效果。（不消耗其可用次数）
 */
const PseudoTenguSweeper = skill(25014)
  .type("burst")
  .costAnemo(3)
  .costEnergy(3)
  // TODO
  .done();

/**
 * @id 2501
 * @name 魔偶剑鬼
 * @description
 * 今日，其仍徘徊在因缘断绝之地。
 */
const MaguuKenki = character(2501)
  .tags("anemo", "monster")
  .skills(Ichimonji, BlusteringBlade, FrostyAssault, PseudoTenguSweeper)
  .done();

/**
 * @id 225011
 * @name 机巧神通
 * @description
 * 战斗行动：我方出战角色为魔偶剑鬼时，装备此牌。
 * 魔偶剑鬼装备此牌后，立刻使用一次孤风刀势。
 * 装备有此牌的魔偶剑鬼使用孤风刀势后，我方切换到后一个角色；使用霜驰影突后，我方切换到前一个角色。
 * （牌组中包含魔偶剑鬼，才能加入牌组）
 */
const TranscendentAutomaton = card(225011, "character")
  .costAnemo(3)
  .talentOf(MaguuKenki)
  .equipment()
  // TODO
  .done();
