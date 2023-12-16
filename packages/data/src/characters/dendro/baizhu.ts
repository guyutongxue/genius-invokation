import { character, skill, summon, combatStatus, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 117051
 * @name 游丝徵灵
 * @description
 * 结束阶段：造成1点草元素伤害，治疗我方出战角色1点。
 * 可用次数：1
 */
const GossamerSprite = summon(117051)
  // TODO
  .done();

/**
 * @id 117052
 * @name 脉摄宣明
 * @description
 * 行动阶段开始时：生成无郤气护盾。
 * 可用次数：2
 */
const PulsingClarity = combatStatus(117052)
  // TODO
  .done();

/**
 * @id 117053
 * @name 无郤气护盾
 * @description
 * 提供1点护盾，保护我方出战角色。
 * 此效果被移除，或被重复生成时：造成1点草元素伤害，治疗我方出战角色1点。
 */
const SeamlessShield = combatStatus(117053)
  // TODO
  .shield(1)
  .on("dispose")
  .done();

/**
 * @id 17051
 * @name 金匮针解
 * @description
 * 造成1点草元素伤害。
 */
const TheClassicsOfAcupuncture = skill(17051)
  .type("normal")
  .costDendro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 17052
 * @name 太素诊要
 * @description
 * 造成1点草元素伤害，召唤游丝徵灵。
 */
const UniversalDiagnosis = skill(17052)
  .type("elemental")
  .costDendro(3)
  // TODO
  .done();

/**
 * @id 17053
 * @name 愈气全形论
 * @description
 * 生成脉摄宣明和无郤气护盾。
 */
const HolisticRevivification = skill(17053)
  .type("burst")
  .costDendro(4)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 1705
 * @name 白术
 * @description
 * 生老三千疾，何处可问医。
 */
const Baizhu = character(1705)
  .tags("dendro", "catalyst", "liyue")
  .health(10)
  .energy(2)
  .skills(TheClassicsOfAcupuncture, UniversalDiagnosis, HolisticRevivification)
  .done();

/**
 * @id 217051
 * @name 在地为化
 * @description
 * 战斗行动：我方出战角色为白术时，装备此牌。
 * 白术装备此牌后，立刻使用一次愈气全形论。
 * 装备有此牌的白术在场，无郤气护盾触发治疗效果时：生成1个出战角色类型的元素骰。
 * （牌组中包含白术，才能加入牌组）
 */
const AllThingsAreOfTheEarth = card(217051)
  .costDendro(4)
  .costEnergy(2)
  .talentOf(Baizhu)
  .equipment()
  // TODO
  .done();
