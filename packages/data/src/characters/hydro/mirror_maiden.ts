import { character, skill, status, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 122022
 * @name 水光破镜
 * @description
 * 所附属角色受到的水元素伤害+1。
 * 所附属角色切换到其他角色时，元素骰费用+1。
 * 持续回合：3
 * （同一方场上最多存在一个此状态）
 */
const Refraction01 = status(122022)
  // TODO
  .done();

/**
 * @id 122021
 * @name 水光破镜
 * @description
 * 所附属角色受到的水元素伤害+1。
 * 持续回合：2
 * （同一方场上最多存在一个此状态）
 */
const Refraction = status(122021)
  // TODO
  .done();

/**
 * @id 22021
 * @name 水弹
 * @description
 * 造成1点水元素伤害。
 */
const WaterBall = skill(22021)
  .type("normal")
  .costHydro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 22022
 * @name 潋波绽破
 * @description
 * 造成2点水元素伤害，目标角色附属水光破镜。
 */
const InfluxBlast = skill(22022)
  .type("elemental")
  .costHydro(3)
  // TODO
  .done();

/**
 * @id 22023
 * @name 粼镜折光
 * @description
 * 造成5点水元素伤害。
 */
const RippledReflection = skill(22023)
  .type("burst")
  .costHydro(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 2202
 * @name 愚人众·藏镜仕女
 * @description
 * 一切隐秘，都将深藏于潋光的水镜之中吧…
 */
const MirrorMaiden = character(2202)
  .tags("hydro", "fatui")
  .skills(WaterBall, InfluxBlast, RippledReflection)
  .done();

/**
 * @id 222021
 * @name 镜锢之笼
 * @description
 * 战斗行动：我方出战角色为愚人众·藏镜仕女时，装备此牌。
 * 愚人众·藏镜仕女装备此牌后，立刻使用一次潋波绽破。
 * 装备有此牌的愚人众·藏镜仕女生成的水光破镜获得以下效果：
 * 初始持续回合+1，并且会使所附属角色切换到其他角色时元素骰费用+1。
 * （牌组中包含愚人众·藏镜仕女，才能加入牌组）
 */
const MirrorCage = card(222021)
  .costHydro(3)
  .talentOf(MirrorMaiden)
  .equipment()
  // TODO
  .done();
