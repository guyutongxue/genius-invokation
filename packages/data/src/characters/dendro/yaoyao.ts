import { character, skill, summon, combatStatus, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 117042
 * @name 月桂·抛掷型
 * @description
 * 结束阶段：造成1点草元素伤害，治疗我方受伤最多的角色1点；如果可用次数仅剩余1，则此效果造成的伤害和治疗各+1。
 * 可用次数：2
 */
const YueguiThrowingMode01 = summon(117042)
  // TODO
  .done();

/**
 * @id 117041
 * @name 月桂·抛掷型
 * @description
 * 结束阶段：造成1点草元素伤害，治疗我方受伤最多的角色1点。
 * 可用次数：2
 */
const YueguiThrowingMode = summon(117041)
  // TODO
  .done();

/**
 * @id 117043
 * @name 桂子仙机
 * @description
 * 我方切换角色后：造成1点草元素伤害，治疗我方出战角色1点。
 * 可用次数：3
 */
const AdeptalLegacy = combatStatus(117043)
  // TODO
  .done();

/**
 * @id 17041
 * @name 颠扑连环枪
 * @description
 * 造成2点物理伤害。
 */
const TossNTurnSpear = skill(17041)
  .type("normal")
  .costDendro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 17042
 * @name 云台团团降芦菔
 * @description
 * 召唤月桂·抛掷型。
 */
const RaphanusSkyCluster = skill(17042)
  .type("elemental")
  .costDendro(3)
  // TODO
  .done();

/**
 * @id 17043
 * @name 玉颗珊珊月中落
 * @description
 * 造成1点草元素伤害，生成桂子仙机。
 */
const MoonjadeDescent = skill(17043)
  .type("burst")
  .costDendro(4)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 1704
 * @name 瑶瑶
 * @description
 * 玲珑玉质，身含仙骨。
 */
const Yaoyao = character(1704)
  .tags("dendro", "pole", "liyue")
  .health(10)
  .energy(2)
  .skills(TossNTurnSpear, RaphanusSkyCluster, MoonjadeDescent)
  .done();

/**
 * @id 217041
 * @name 慈惠仁心
 * @description
 * 战斗行动：我方出战角色为瑶瑶时，装备此牌。
 * 瑶瑶装备此牌后，立刻使用一次云台团团降芦菔。
 * 装备有此牌的瑶瑶生成的月桂·抛掷型，在可用次数仅剩余最后1次时造成的伤害和治疗各+1。
 * （牌组中包含瑶瑶，才能加入牌组）
 */
const Beneficent = card(217041)
  .costDendro(3)
  .talentOf(Yaoyao)
  .equipment()
  // TODO
  .done();
