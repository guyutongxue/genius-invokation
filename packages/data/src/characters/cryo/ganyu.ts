import { character, skill, summon, combatStatus, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 111011
 * @name 冰灵珠
 * @description
 * 结束阶段：造成1点冰元素伤害，对所有敌方后台角色造成1点穿透伤害。
 * 可用次数：2
 */
const SacredCryoPearl = summon(111011)
  // TODO
  .done();

/**
 * @id 111012
 * @name 冰莲
 * @description
 * 我方出战角色受到伤害时：抵消1点伤害。
 * 可用次数：2
 */
const IceLotus = combatStatus(111012)
  // TODO
  .done();

/**
 * @id 11011
 * @name 流天射术
 * @description
 * 造成2点物理伤害。
 */
const LiutianArchery = skill(11011)
  .type("normal")
  .costCryo(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 11012
 * @name 山泽麟迹
 * @description
 * 造成1点冰元素伤害，生成冰莲。
 */
const TrailOfTheQilin = skill(11012)
  .type("elemental")
  .costCryo(3)
  // TODO
  .done();

/**
 * @id 11013
 * @name 霜华矢
 * @description
 * 造成2点冰元素伤害，对所有敌方后台角色造成2点穿透伤害。
 */
const FrostflakeArrow = skill(11013)
  .type("normal")
  .costCryo(5)
  // TODO
  .done();

/**
 * @id 11014
 * @name 降众天华
 * @description
 * 造成2点冰元素伤害，对所有敌方后台角色造成1点穿透伤害，召唤冰灵珠。
 */
const CelestialShower = skill(11014)
  .type("burst")
  .costCryo(3)
  .costEnergy(3)
  // TODO
  .done();

/**
 * @id 1101
 * @name 甘雨
 * @description
 * 「既然是明早前要，那这份通稿，只要熬夜写完就好。」
 */
const Ganyu = character(1101)
  .tags("cryo", "bow", "liyue")
  .skills(LiutianArchery, TrailOfTheQilin, FrostflakeArrow, CelestialShower)
  .done();

/**
 * @id 211011
 * @name 唯此一心
 * @description
 * 战斗行动：我方出战角色为甘雨时，装备此牌。
 * 甘雨装备此牌后，立刻使用一次霜华矢。
 * 装备有此牌的甘雨使用霜华矢时：如果此技能在本场对局中曾经被使用过，则其对敌方后台角色造成的穿透伤害改为3点。
 * （牌组中包含甘雨，才能加入牌组）
 */
const UndividedHeart = card(211011, "character")
  .costCryo(5)
  .talentOf(Ganyu)
  .equipment()
  // TODO
  .done();
