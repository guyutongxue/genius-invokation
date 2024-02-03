import { character, skill, summon, status, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 124013
 * @name 雷锁镇域
 * @description
 * 结束阶段：造成1点雷元素伤害。
 * 可用次数：2
 * 此召唤物在场时：敌方执行「切换角色」行动的元素骰费用+1。（每回合1次）
 */
export const ChainsOfWardingThunder = summon(124013)
  // TODO
  .done();

/**
 * @id 124015
 * @name 雷晶核心
 * @description
 * 所附属角色被击倒时：移除此效果，使角色免于被击倒，并治疗该角色到6点生命值。
 */
export const ElectroCrystalCore01 = status(124015)
  // TODO
  .done();

/**
 * @id 124016
 * @name 雷晶核心
 * @description
 * 所附属角色被击倒时：移除此效果，使角色免于被击倒，并治疗该角色到10点生命值。
 */
export const ElectroCrystalCore02 = status(124016)
  // TODO
  .done();

/**
 * @id 124014
 * @name 雷晶核心
 * @description
 * 所附属角色被击倒时：移除此效果，使角色免于被击倒，并治疗该角色到1点生命值。
 */
export const ElectroCrystalCore = status(124014)
  // TODO
  .done();

/**
 * @id 124012
 * @name 猜拳三连击·布
 * @description
 * 本角色将在下次行动时，直接使用技能：猜拳三连击·布。
 */
export const RockpaperscissorsComboPaperStatus = status(124012)
  // TODO
  .done();

/**
 * @id 124011
 * @name 猜拳三连击·剪刀
 * @description
 * 本角色将在下次行动时，直接使用技能：猜拳三连击·剪刀。
 */
export const RockpaperscissorsComboScissorsStatus = status(124011)
  // TODO
  .done();

/**
 * @id 24011
 * @name 雷晶投射
 * @description
 * 造成1点雷元素伤害。
 */
export const ElectroCrystalProjection = skill(24011)
  .type("normal")
  .costElectro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 24012
 * @name 猜拳三连击
 * @description
 * 造成2点雷元素伤害，然后分别准备技能：猜拳三连击·剪刀和猜拳三连击·布。
 */
export const RockpaperscissorsCombo = skill(24012)
  .type("elemental")
  .costElectro(5)
  // TODO
  .done();

/**
 * @id 24013
 * @name 雳霆镇锁
 * @description
 * 造成2点雷元素伤害，召唤雷锁镇域。
 */
export const LightningLockdown = skill(24013)
  .type("burst")
  .costElectro(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 24014
 * @name 雷晶核心
 * @description
 * 【被动】战斗开始时，初始附属雷晶核心。
 */
export const ElectroCrystalCoreSkill = skill(24014)
  .type("passive")
  // TODO
  .done();

/**
 * @id 24015
 * @name 猜拳三连击·剪刀
 * @description
 * （需准备1个行动轮）
 * 造成2点雷元素伤害，然后准备技能：猜拳三连击·布。
 */
export const RockpaperscissorsComboScissors = skill(24015)
  .type("elemental")
  // TODO
  .done();

/**
 * @id 24016
 * @name 猜拳三连击·布
 * @description
 * （需准备1个行动轮）
 * 造成3点雷元素伤害。
 */
export const RockpaperscissorsComboPaper = skill(24016)
  .type("elemental")
  // TODO
  .done();

/**
 * @id 2401
 * @name 无相之雷
 * @description
 * 代号为「阿莱夫」的高级雷元素生命。
 * 就算猜拳获胜，它一般也不会认输。
 */
export const ElectroHypostasis = character(2401)
  .tags("electro", "monster")
  .health(8)
  .energy(2)
  .skills(ElectroCrystalProjection, RockpaperscissorsCombo, LightningLockdown, ElectroCrystalCoreSkill)
  .done();

/**
 * @id 224011
 * @name 汲能棱晶
 * @description
 * 战斗行动：我方出战角色为无相之雷时，治疗该角色3点，并附属雷晶核心。
 * （牌组中包含无相之雷，才能加入牌组）
 */
export const AbsorbingPrism = card(224011)
  .costElectro(2)
  .eventTalent(ElectroHypostasis)
  // TODO
  .done();
