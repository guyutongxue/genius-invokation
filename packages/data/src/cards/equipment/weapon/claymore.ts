import { card } from "@gi-tcg/core/builder";

/**
 * @id 311301
 * @name 白铁大剑
 * @description
 * 角色造成的伤害+1。
 * （「双手剑」角色才能装备。角色最多装备1件「武器」）
 */
export const WhiteIronGreatsword = card(311301)
  .costSame(2)
  .weapon("claymore")
  // TODO
  .done();

/**
 * @id 311302
 * @name 祭礼大剑
 * @description
 * 角色造成的伤害+1。
 * 角色使用「元素战技」后：生成1个此角色类型的元素骰。（每回合1次）
 * （「双手剑」角色才能装备。角色最多装备1件「武器」）
 */
export const SacrificialGreatsword = card(311302)
  .costSame(3)
  .weapon("claymore")
  // TODO
  .done();

/**
 * @id 311303
 * @name 狼的末路
 * @description
 * 角色造成的伤害+1。
 * 攻击剩余生命值不多于6的目标时，伤害额外+2。
 * （「双手剑」角色才能装备。角色最多装备1件「武器」）
 */
export const WolfsGravestone = card(311303)
  .costSame(3)
  .weapon("claymore")
  // TODO
  .done();

/**
 * @id 311304
 * @name 天空之傲
 * @description
 * 角色造成的伤害+1。
 * 每回合1次：角色使用「普通攻击」造成的伤害额外+1。
 * （「双手剑」角色才能装备。角色最多装备1件「武器」）
 */
export const SkywardPride = card(311304)
  .costSame(3)
  .weapon("claymore")
  // TODO
  .done();

/**
 * @id 311305
 * @name 钟剑
 * @description
 * 角色造成的伤害+1。
 * 角色使用技能后：为我方出战角色提供1点护盾。（每回合1次，可叠加到2点）
 * （「双手剑」角色才能装备。角色最多装备1件「武器」）
 */
export const TheBell = card(311305)
  .costSame(3)
  .weapon("claymore")
  // TODO
  .done();

/**
 * @id 311306
 * @name 苇海信标
 * @description
 * 角色造成的伤害+1。
 * 角色使用「元素战技」后：本回合内，角色下次造成的伤害额外+1。（每回合1次）
 * 角色受到伤害后：本回合内，角色下次造成的伤害额外+1。（每回合1次）
 * （「双手剑」角色才能装备。角色最多装备1件「武器」）
 */
export const BeaconOfTheReedSea = card(311306)
  .costSame(3)
  .weapon("claymore")
  // TODO
  .done();
