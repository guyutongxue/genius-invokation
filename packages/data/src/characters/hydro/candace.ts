import { character, skill, status, combatStatus, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 112071
 * @name 苍鹭护盾
 * @description
 * 本角色将在下次行动时，直接使用技能：苍鹭震击。
 * 准备技能期间：提供2点护盾，保护所附属的角色。
 */
const HeronShield = status(112071)
  // TODO
  .done();

/**
 * @id 112073
 * @name 赤冕祝祷
 * @description
 * 我方角色普通攻击造成的伤害+1。
 * 我方单手剑、双手剑或长柄武器角色造成的物理伤害变为水元素伤害。
 * 我方切换角色后：造成1点水元素伤害。（每回合1次）
 * 我方角色普通攻击后：造成1点水元素伤害。（每回合1次）
 * 持续回合：2
 */
const PrayerOfTheCrimsonCrown01 = combatStatus(112073)
  // TODO
  .done();

/**
 * @id 112072
 * @name 赤冕祝祷
 * @description
 * 我方角色普通攻击造成的伤害+1。
 * 我方单手剑、双手剑或长柄武器角色造成的物理伤害变为水元素伤害。
 * 我方切换角色后：造成1点水元素伤害。（每回合1次）
 * 持续回合：2
 */
const PrayerOfTheCrimsonCrown = combatStatus(112072)
  // TODO
  .done();

/**
 * @id 12071
 * @name 流耀枪术·守势
 * @description
 * 造成2点物理伤害。
 */
const GleamingSpearGuardianStance = skill(12071)
  .type("normal")
  .costHydro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 12072
 * @name 圣仪·苍鹭庇卫
 * @description
 * 本角色附属苍鹭护盾并准备技能：苍鹭震击。
 */
const SacredRiteHeronsSanctum = skill(12072)
  .type("elemental")
  .costHydro(3)
  // TODO
  .done();

/**
 * @id 12073
 * @name 圣仪·灰鸰衒潮
 * @description
 * 造成2点水元素伤害，生成赤冕祝祷。
 */
const SacredRiteWagtailsTide = skill(12073)
  .type("burst")
  .costHydro(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 12074
 * @name 苍鹭震击
 * @description
 * （需准备1个行动轮）
 * 造成3点水元素伤害。
 */
const HeronStrike = skill(12074)
  .type("elemental")
  // TODO
  .done();

/**
 * @id 1207
 * @name 坎蒂丝
 * @description
 * 赤沙浮金，恪誓戍御。
 */
const Candace = character(1207)
  .tags("hydro", "pole", "sumeru")
  .skills(GleamingSpearGuardianStance, SacredRiteHeronsSanctum, SacredRiteWagtailsTide, HeronStrike)
  .done();

/**
 * @id 212071
 * @name 衍溢的汐潮
 * @description
 * 战斗行动：我方出战角色为坎蒂丝时，装备此牌。
 * 坎蒂丝装备此牌后，立刻使用一次圣仪·灰鸰衒潮。
 * 装备有此牌的坎蒂丝生成的赤冕祝祷额外具有以下效果：我方角色普通攻击后：造成1点水元素伤害。（每回合1次）
 * （牌组中包含坎蒂丝，才能加入牌组）
 */
const TheOverflow = card(212071)
  .costHydro(3)
  .costEnergy(2)
  .talentOf(Candace)
  .equipment()
  // TODO
  .done();
