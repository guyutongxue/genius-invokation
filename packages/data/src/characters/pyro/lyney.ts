import { character, skill, summon, status, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 113101
 * @name 怪笑猫猫帽
 * @description
 * 结束阶段：造成1点火元素伤害。
 * 可用次数：1（可叠加，最多叠加到2次）
 */
const GrinmalkinHat = summon(113101)
  // TODO
  .done();

/**
 * @id 113102
 * @name 隐具余数
 * @description
 * 隐具余数最多可以叠加到3层。
 * 角色使用眩惑光戏法时：每层隐具余数使伤害+1。技能结算后，耗尽隐具余数，每层治疗角色1点。
 */
const PropSurplus = status(113102)
  // TODO
  .done();

/**
 * @id 13101
 * @name 迫牌易位式
 * @description
 * 造成2点物理伤害。
 */
const CardForceTranslocation = skill(13101)
  .type("normal")
  .costPyro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 13102
 * @name 隐具魔术箭
 * @description
 * 造成2点火元素伤害，召唤怪笑猫猫帽，累积1层隐具余数。
 * 如果本角色生命值至少为6，则对自身造成1点穿透伤害。
 */
const PropArrow = skill(13102)
  .type("normal")
  .costPyro(3)
  // TODO
  .done();

/**
 * @id 13103
 * @name 眩惑光戏法
 * @description
 * 造成3点火元素伤害。
 */
const BewilderingLights = skill(13103)
  .type("elemental")
  .costPyro(3)
  // TODO
  .done();

/**
 * @id 13104
 * @name 大魔术·灵迹巡游
 * @description
 * 造成3点火元素伤害，召唤怪笑猫猫帽，累积1层隐具余数。
 */
const WondrousTrickMiracleParade = skill(13104)
  .type("burst")
  .costPyro(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 1310
 * @name 林尼
 * @description
 * 镜中捧花，赠予何人。
 */
const Lyney = character(1310)
  .tags("pyro", "bow", "fontaine", "fatui", "ousia")
  .health(10)
  .energy(2)
  .skills(CardForceTranslocation, PropArrow, BewilderingLights, WondrousTrickMiracleParade)
  .done();

/**
 * @id 213101
 * @name 完场喝彩
 * @description
 * 战斗行动：我方出战角色为林尼时，装备此牌。
 * 林尼装备此牌后，立刻使用一次隐具魔术箭。
 * 装备有此牌的林尼在场时，林尼自身和怪笑猫猫帽对具有火元素附着的角色造成的伤害+2。（每回合1次）
 * （牌组中包含林尼，才能加入牌组）
 */
const ConclusiveOvation = card(213101)
  .costPyro(3)
  .talent(Lyney)
  // TODO
  .done();
