import { character, skill, status, combatStatus, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 125024
 * @name 龙威
 * @description
 * 特瓦林下次造成的伤害+1
 */
const DraconicMajesty = status(125024)
  // TODO
  .done();

/**
 * @id 125023
 * @name 风龙吐息
 * @description
 * 本角色将在下次行动时，直接使用技能：终幕涤流。
 */
const DvalinsSigh01 = status(125023)
  // TODO
  .done();

/**
 * @id 125022
 * @name 风龙吐息
 * @description
 * 本角色将在下次行动时，直接使用技能：长延涤流。
 */
const DvalinsSigh = status(125022)
  // TODO
  .done();

/**
 * @id 125021
 * @name 坍毁
 * @description
 * 所附属角色受到的物理伤害或风元素伤害+2。
 * 可用次数：1
 */
const TotalCollapse = status(125021)
  // TODO
  .done();

/**
 * @id 125025
 * @name 坍裂的高台
 * @description
 * 结束阶段：对我方出战角色附属坍毁。
 */
const CollapsingPlatform = combatStatus(125025)
  // TODO
  .done();

/**
 * @id 25021
 * @name 裂爪横击
 * @description
 * 造成2点物理伤害。
 */
const LaceratingSlash = skill(25021)
  .type("normal")
  .costAnemo(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 25022
 * @name 暴风轰击
 * @description
 * 造成2点风元素伤害，目标角色附属坍毁。
 */
const TempestuousBarrage = skill(25022)
  .type("elemental")
  .costAnemo(3)
  // TODO
  .done();

/**
 * @id 25023
 * @name 风龙涤流
 * @description
 * 造成2点风元素伤害，然后分别准备技能：长延涤流和终幕涤流。
 */
const DvalinsCleansing = skill(25023)
  .type("elemental")
  .costAnemo(5)
  // TODO
  .done();

/**
 * @id 25024
 * @name 终天闭幕曲
 * @description
 * 造成5点风元素伤害，所有敌方后台角色附属坍毁。
 */
const CaelestinumFinaleTermini = skill(25024)
  .type("burst")
  .costAnemo(4)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 25025
 * @name 长延涤流
 * @description
 * （需准备1个行动轮）
 * 对下一个敌方后台角色造成1点风元素伤害，然后准备技能：终幕涤流。（敌方没有后台角色时，改为对出战角色造成伤害）
 */
const PerpetualCleansing = skill(25025)
  .type("elemental")
  // TODO
  .done();

/**
 * @id 25026
 * @name 终幕涤流
 * @description
 * （需准备1个行动轮）
 * 对上一个敌方后台角色造成2点风元素伤害。（敌方没有后台角色时，改为对出战角色造成伤害）
 */
const UltimateCleansing = skill(25026)
  .type("elemental")
  // TODO
  .done();

/**
 * @id 2502
 * @name 特瓦林
 * @description
 * 「如果你曾是我，看见过你在蓝蓝的天上滑翔的孤高模样，见识过你的美丽身姿就好了。」
 * 「如此，你就会明白，这样的天空与大地，是值得为之奋战的。」
 */
const Dvalin = character(2502)
  .tags("anemo", "monster")
  .health(10)
  .energy(2)
  .skills(LaceratingSlash, TempestuousBarrage, DvalinsCleansing, CaelestinumFinaleTermini, PerpetualCleansing, UltimateCleansing)
  .done();

/**
 * @id 225021
 * @name 毁裂风涡
 * @description
 * 战斗行动：我方出战角色为特瓦林时，装备此牌。
 * 特瓦林装备此牌后，立刻使用一次暴风轰击。
 * 装备有此牌的特瓦林在场时，敌方出战角色所附属的坍毁状态被移除后：对下一个敌方后台角色附属坍毁。（每回合1次）
 * （牌组中包含特瓦林，才能加入牌组）
 */
const RendingVortex = card(225021)
  .costAnemo(3)
  .talent(Dvalin)
  // TODO
  .done();
