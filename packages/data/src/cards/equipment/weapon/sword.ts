import { card } from "@gi-tcg/core/builder";

/**
 * @id 311503
 * @name 风鹰剑
 * @description
 * 角色造成的伤害+1。
 * 对方使用技能后：如果所附属角色为「出战角色」，则治疗该角色1点。（每回合至多2次）
 * （「单手剑」角色才能装备。角色最多装备1件「武器」）
 */
const AquilaFavonia = card(311503, "character")
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
const FavoniusSword = card(311505, "character")
  .costSame(3)
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
const SacrificialSword = card(311502, "character")
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
const SkywardBlade = card(311504, "character")
  .costSame(3)
  .weapon("sword")
  // TODO
  .done();

/**
 * @id 311501
 * @name 旅行剑
 * @description
 * 角色造成的伤害+1。
 * （「单手剑」角色才能装备。角色最多装备1件「武器」）
 */
const TravelersHandySword = card(311501, "character")
  .costSame(2)
  .weapon("sword")
  // TODO
  .done();
