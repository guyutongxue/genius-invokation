import { character, skill, summon, combatStatus, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 117011
 * @name 柯里安巴
 * @description
 * 结束阶段：造成2点草元素伤害。
 * 可用次数：2
 */
const CuileinAnbar = summon(117011)
  // TODO
  .done();

/**
 * @id 117012
 * @name 新叶
 * @description
 * 我方角色使用技能引发草元素相关反应后：造成1点草元素伤害。（每回合1次）
 * 持续回合：1
 */
const Sprout = combatStatus(117012)
  // TODO
  .done();

/**
 * @id 17011
 * @name 祈颂射艺
 * @description
 * 造成2点物理伤害。
 */
const SupplicantsBowmanship = skill(17011)
  .type("normal")
  .costDendro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 17012
 * @name 拂花偈叶
 * @description
 * 造成3点草元素伤害。
 */
const FloralBrush = skill(17012)
  .type("elemental")
  .costDendro(3)
  // TODO
  .done();

/**
 * @id 17013
 * @name 猫猫秘宝
 * @description
 * 造成2点草元素伤害，召唤柯里安巴。
 */
const TrumpcardKitty = skill(17013)
  .type("burst")
  .costDendro(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 1701
 * @name 柯莱
 * @description
 * 「大声喊出卡牌的名字会让它威力加倍…这一定是虚构的吧？」
 */
const Collei = character(1701)
  .tags("dendro", "bow", "sumeru")
  .health(10)
  .energy(2)
  .skills(SupplicantsBowmanship, FloralBrush, TrumpcardKitty)
  .done();

/**
 * @id 217011
 * @name 飞叶迴斜
 * @description
 * 战斗行动：我方出战角色为柯莱时，装备此牌。
 * 柯莱装备此牌后，立刻使用一次拂花偈叶。
 * 装备有此牌的柯莱使用了拂花偈叶的回合中，我方角色的技能引发草元素相关反应后：造成1点草元素伤害。（每回合1次）
 * （牌组中包含柯莱，才能加入牌组）
 */
const FloralSidewinder = card(217011)
  .costDendro(4)
  .talentOf(Collei)
  .equipment()
  // TODO
  .done();
