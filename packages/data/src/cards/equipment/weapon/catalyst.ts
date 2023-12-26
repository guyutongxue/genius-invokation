import { card } from "@gi-tcg/core/builder";

/**
 * @id 311104
 * @name 千夜浮梦
 * @description
 * 角色造成的伤害+1。
 * 我方角色引发元素反应时：造成的伤害+1。（每回合最多触发2次）
 * （「法器」角色才能装备。角色最多装备1件「武器」）
 */
const AThousandFloatingDreams = card(311104)
  .costSame(3)
  .weapon("catalyst")
  // TODO
  .done();

/**
 * @id 311105
 * @name 盈满之实
 * @description
 * 角色造成的伤害+1。
 * 入场时：抓2张牌。
 * （「法器」角色才能装备。角色最多装备1件「武器」）
 */
const FruitOfFulfillment = card(311105)
  .costVoid(3)
  .weapon("catalyst")
  // TODO
  .done();

/**
 * @id 311101
 * @name 魔导绪论
 * @description
 * 角色造成的伤害+1。
 * （「法器」角色才能装备。角色最多装备1件「武器」）
 */
const MagicGuide = card(311101)
  .costSame(2)
  .weapon("catalyst")
  // TODO
  .done();

/**
 * @id 311102
 * @name 祭礼残章
 * @description
 * 角色造成的伤害+1。
 * 角色使用「元素战技」后：生成1个此角色类型的元素骰。（每回合1次）
 * （「法器」角色才能装备。角色最多装备1件「武器」）
 */
const SacrificialFragments = card(311102)
  .costSame(3)
  .weapon("catalyst")
  // TODO
  .done();

/**
 * @id 311103
 * @name 天空之卷
 * @description
 * 角色造成的伤害+1。
 * 每回合1次：角色使用「普通攻击」造成的伤害额外+1。
 * （「法器」角色才能装备。角色最多装备1件「武器」）
 */
const SkywardAtlas = card(311103)
  .costSame(3)
  .weapon("catalyst")
  // TODO
  .done();
