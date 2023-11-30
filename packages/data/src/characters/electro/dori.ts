import { character, skill, summon, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 114101
 * @name 售后服务弹
 * @description
 * 结束阶段：造成1点雷元素伤害。
 * 可用次数：1
 */
const AftersalesServiceRounds = summon(114101)
  // TODO
  .done();

/**
 * @id 114103
 * @name 灯中幽精
 * @description
 * 结束阶段：治疗我方出战角色2点，并使其获得1点充能。
 * 治疗生命值不多于6的角色时，治疗量+1；使没有充能的角色获得充能时，获得量+1。
 * 可用次数：2
 */
const Jinni01 = summon(114103)
  // TODO
  .done();

/**
 * @id 114102
 * @name 灯中幽精
 * @description
 * 结束阶段：治疗我方出战角色2点，并使其获得1点充能。
 * 可用次数：2
 */
const Jinni = summon(114102)
  // TODO
  .done();

/**
 * @id 14101
 * @name 妙显剑舞·改
 * @description
 * 造成2点物理伤害。
 */
const MarvelousSworddanceModified = skill(14101)
  .type("normal")
  .costElectro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 14102
 * @name 镇灵之灯·烦恼解决炮
 * @description
 * 造成2点雷元素伤害，召唤售后服务弹。
 */
const SpiritwardingLampTroubleshooterCannon = skill(14102)
  .type("elemental")
  .costElectro(3)
  // TODO
  .done();

/**
 * @id 14103
 * @name 卡萨扎莱宫的无微不至
 * @description
 * 造成1点雷元素伤害，召唤灯中幽精。
 */
const AlcazarzaraysExactitude = skill(14103)
  .type("burst")
  .costElectro(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 1410
 * @name 多莉
 * @description
 * 摩拉多多，快乐多多！
 */
const Dori = character(1410)
  .tags("electro", "claymore", "sumeru")
  .skills(MarvelousSworddanceModified, SpiritwardingLampTroubleshooterCannon, AlcazarzaraysExactitude)
  .done();

/**
 * @id 214101
 * @name 酌盈剂虚
 * @description
 * 战斗行动：我方出战角色为多莉时，装备此牌。
 * 多莉装备此牌后，立刻使用一次卡萨扎莱宫的无微不至。
 * 装备有此牌的多莉所召唤的灯中幽精，对生命值不多于6的角色造成的治疗+1，使没有充能的角色获得充能时获得量+1。
 * （牌组中包含多莉，才能加入牌组）
 */
const DiscretionarySupplement = card(214101, "character")
  .costElectro(3)
  .costEnergy(2)
  .talentOf(Dori)
  .equipment()
  // TODO
  .done();
