import { character, skill, summon, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 113041
 * @name 兔兔伯爵
 * @description
 * 我方出战角色受到伤害时：抵消2点伤害。
 * 可用次数：1，耗尽时不弃置此牌。
 * 结束阶段，如果可用次数已耗尽：弃置此牌，以造成2点火元素伤害。
 */
export const BaronBunny = summon(113041)
  // TODO
  .done();

/**
 * @id 13041
 * @name 神射手
 * @description
 * 造成2点物理伤害。
 */
export const Sharpshooter = skill(13041)
  .type("normal")
  .costPyro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 13042
 * @name 爆弹玩偶
 * @description
 * 召唤兔兔伯爵。
 */
export const ExplosivePuppet = skill(13042)
  .type("elemental")
  .costPyro(3)
  // TODO
  .done();

/**
 * @id 13043
 * @name 箭雨
 * @description
 * 造成2点火元素伤害，对所有敌方后台角色造成2点穿透伤害。
 */
export const FieryRain = skill(13043)
  .type("burst")
  .costPyro(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 1304
 * @name 安柏
 * @description
 * 如果想要成为一名伟大的牌手…
 * 首先，要有坐上牌桌的勇气。
 */
export const Amber = character(1304)
  .tags("pyro", "bow", "mondstadt")
  .health(10)
  .energy(2)
  .skills(Sharpshooter, ExplosivePuppet, FieryRain)
  .done();

/**
 * @id 213041
 * @name 一触即发
 * @description
 * 战斗行动：我方出战角色为安柏时，装备此牌。
 * 安柏装备此牌后，立刻使用一次爆弹玩偶。
 * 安柏普通攻击后：如果此牌和兔兔伯爵仍在场，则引爆兔兔伯爵，造成4点火元素伤害。
 * （牌组中包含安柏，才能加入牌组）
 */
export const BunnyTriggered = card(213041)
  .costPyro(3)
  .talent(Amber)
  // TODO
  .done();
