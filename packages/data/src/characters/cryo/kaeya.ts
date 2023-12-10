import { character, skill, combatStatus, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 111031
 * @name 寒冰之棱
 * @description
 * 我方切换角色后：造成2点冰元素伤害。
 * 可用次数：3
 */
const Icicle = combatStatus(111031)
  // TODO
  .done();

/**
 * @id 11031
 * @name 仪典剑术
 * @description
 * 造成2点物理伤害。
 */
const CeremonialBladework = skill(11031)
  .type("normal")
  .costCryo(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 11032
 * @name 霜袭
 * @description
 * 造成3点冰元素伤害。
 */
const Frostgnaw = skill(11032)
  .type("elemental")
  .costCryo(3)
  // TODO
  .done();

/**
 * @id 11033
 * @name 凛冽轮舞
 * @description
 * 造成1点冰元素伤害，生成寒冰之棱。
 */
const GlacialWaltz = skill(11033)
  .type("burst")
  .costCryo(4)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 1103
 * @name 凯亚
 * @description
 * 他很擅长在他人身上发掘出「骑士般的美德」。
 */
const Kaeya = character(1103)
  .tags("cryo", "sword", "mondstadt")
  .skills(CeremonialBladework, Frostgnaw, GlacialWaltz)
  .done();

/**
 * @id 211031
 * @name 冷血之剑
 * @description
 * 战斗行动：我方出战角色为凯亚时，装备此牌。
 * 凯亚装备此牌后，立刻使用一次霜袭。
 * 装备有此牌的凯亚使用霜袭后：治疗自身2点。（每回合1次）
 * （牌组中包含凯亚，才能加入牌组）
 */
const ColdbloodedStrike = card(211031)
  .costCryo(4)
  .talentOf(Kaeya)
  .equipment()
  // TODO
  .done();
