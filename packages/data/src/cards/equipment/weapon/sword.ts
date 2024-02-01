import { card } from "@gi-tcg/core/builder";

/**
 * @id 311501
 * @name 旅行剑
 * @description
 * 角色造成的伤害+1。
 * （「单手剑」角色才能装备。角色最多装备1件「武器」）
 */
export const TravelersHandySword = card(311501)
  .costSame(2)
  .weapon("sword")
  // TODO
  .done();

/**
 * @id 311502
 * @name 祭礼剑
 * @description
 * 角色造成的伤害+1。
 * 角色使用「元素战技」后：生成1个此角色类型的元素骰。（每回合1次）
 * （「单手剑」角色才能装备。角色最多装备1件「武器」）
 */
export const SacrificialSword = card(311502)
  .costSame(3)
  .weapon("sword")
  // TODO
  .done();

/**
 * @id 311503
 * @name 风鹰剑
 * @description
 * 角色造成的伤害+1。
 * 对方使用技能后：如果所附属角色为「出战角色」，则治疗该角色1点。（每回合至多2次）
 * （「单手剑」角色才能装备。角色最多装备1件「武器」）
 */
export const AquilaFavonia = card(311503)
  .costSame(3)
  .weapon("sword")
  // TODO
  .done();

/**
 * @id 311504
 * @name 天空之刃
 * @description
 * 角色造成的伤害+1。
 * 每回合1次：角色使用「普通攻击」造成的伤害额外+1。
 * （「单手剑」角色才能装备。角色最多装备1件「武器」）
 */
export const SkywardBlade = card(311504)
  .costSame(3)
  .weapon("sword")
  // TODO
  .done();

/**
 * @id 311505
 * @name 西风剑
 * @description
 * 角色造成的伤害+1。
 * 角色使用「元素战技」后：角色额外获得1点充能。（每回合1次）
 * （「单手剑」角色才能装备。角色最多装备1件「武器」）
 */
export const FavoniusSword = card(311505)
  .costSame(3)
  .weapon("sword")
  // TODO
  .done();

/**
 * @id 311506
 * @name 裁叶萃光
 * @description
 * 角色造成的伤害+1。
 * 角色使用「普通攻击」后：生成1个随机基础元素骰。（每回合最多触发2次）
 * （「单手剑」角色才能装备。角色最多装备1件「武器」）
 */
export const LightOfFoliarIncision = card(311506)
  .costSame(3)
  .weapon("sword")
  // TODO
  .done();

/**
 * @id 311507
 * @name 原木刀
 * @description
 * 角色造成的伤害+1。
 * 入场时：所附属角色在本回合中，下次使用「普通攻击」后：生成2个此角色类型的元素骰。
 * （「单手剑」角色才能装备。角色最多装备1件「武器」）
 */
export const SapwoodBlade = card(311507)
  .costVoid(3)
  .weapon("sword")
  // TODO
  .done();
