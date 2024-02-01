import { character, skill, summon, status, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 115072
 * @name 不倒貉貉
 * @description
 * 结束阶段：造成1点风元素伤害，治疗我方受伤最多的角色2点。
 * 可用次数：2
 */
export const MujimujiDaruma = summon(115072)
  // TODO
  .done();

/**
 * @id 115071
 * @name 风风轮
 * @description
 * 本角色将在下次行动时，直接使用技能：风风轮舞踢。
 */
export const FuufuuWindwheel = status(115071)
  // TODO
  .done();

/**
 * @id 15071
 * @name 忍刀·终末番
 * @description
 * 造成2点物理伤害。
 */
export const ShuumatsubanNinjaBlade = skill(15071)
  .type("normal")
  .costAnemo(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 15072
 * @name 呜呼流·风隐急进
 * @description
 * 造成2点风元素伤害，本角色准备技能：风风轮舞踢。
 * 如果当前技能引发了扩散，则风风轮舞踢将改为造成被扩散元素的伤害。
 */
export const YoohooArtFuuinDash = skill(15072)
  .type("elemental")
  .costAnemo(3)
  // TODO
  .done();

/**
 * @id 15073
 * @name 呜呼流·影貉缭乱
 * @description
 * 造成1点风元素伤害，召唤不倒貉貉。
 */
export const YoohooArtMujinaFlurry = skill(15073)
  .type("burst")
  .costAnemo(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 15074
 * @name 风风轮舞踢
 * @description
 * （需准备1个行动轮）
 * 造成2点风元素伤害（或被扩散元素的伤害）。
 */
export const FuufuuWhirlwindKick = skill(15074)
  .type("elemental")
  // TODO
  .done();

/**
 * @id 1507
 * @name 早柚
 * @description
 * 一梦作伴，万野无踪。
 */
export const Sayu = character(1507)
  .tags("anemo", "claymore", "inazuma")
  .health(10)
  .energy(2)
  .skills(ShuumatsubanNinjaBlade, YoohooArtFuuinDash, YoohooArtMujinaFlurry, FuufuuWhirlwindKick)
  .done();

/**
 * @id 215071
 * @name 偷懒的新方法
 * @description
 * 战斗行动：我方出战角色为早柚时，装备此牌。
 * 早柚装备此牌后，立刻使用一次呜呼流·风隐急进。
 * 装备有此牌的早柚为出战角色期间，我方引发扩散反应时：抓2张牌。（每回合1次）
 * （牌组中包含早柚，才能加入牌组）
 */
export const SkivingNewAndImproved = card(215071)
  .costAnemo(3)
  .talent(Sayu)
  // TODO
  .done();
