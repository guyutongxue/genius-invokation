import { character, skill, summon, combatStatus, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 116062
 * @name 大将威仪
 * @description
 * 结束阶段：造成1点岩元素伤害；如果队伍中存在2名岩元素角色，则生成结晶。
 * 可用次数：2
 */
const GeneralsGlory = summon(116062)
  // TODO
  .done();

/**
 * @id 116061
 * @name 大将旗指物
 * @description
 * 我方角色造成的岩元素伤害+1。
 * 持续回合：2（可叠加，最多叠加到3回合）
 */
const GeneralsWarBanner = combatStatus(116061)
  // TODO
  .done();

/**
 * @id 16061
 * @name 呲牙裂扇箭
 * @description
 * 造成2点物理伤害。
 */
const RippingFangFletching = skill(16061)
  .type("normal")
  .costGeo(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 16062
 * @name 犬坂吠吠方圆阵
 * @description
 * 造成2点岩元素伤害，生成大将旗指物。
 */
const InuzakaAllroundDefense = skill(16062)
  .type("elemental")
  .costGeo(3)
  // TODO
  .done();

/**
 * @id 16063
 * @name 兽牙逐突形胜战法
 * @description
 * 造成2点岩元素伤害，生成大将旗指物，召唤大将威仪。
 */
const JuugaForwardUntoVictory = skill(16063)
  .type("burst")
  .costGeo(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 1606
 * @name 五郎
 * @description
 * 锵锵领兵行！
 */
const Gorou = character(1606)
  .tags("geo", "bow", "inazuma")
  .health(10)
  .energy(2)
  .skills(RippingFangFletching, InuzakaAllroundDefense, JuugaForwardUntoVictory)
  .done();

/**
 * @id 216061
 * @name 犬奔·疾如风
 * @description
 * 战斗行动：我方出战角色为五郎时，装备此牌。
 * 五郎装备此牌后，立刻使用一次犬坂吠吠方圆阵。
 * 装备有此牌的五郎在场时，我方角色造成岩元素伤害后：如果场上存在大将旗指物，抓1张牌。（每回合1次）
 * （牌组中包含五郎，才能加入牌组）
 */
const RushingHoundSwiftAsTheWind = card(216061)
  .costGeo(3)
  .talent(Gorou)
  // TODO
  .done();
