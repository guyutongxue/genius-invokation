import { card } from '@gi-tcg';

/**
 * @id 311204
 * @name 阿莫斯之弓
 * @description
 * 角色造成的伤害+1。
 * 角色使用原本元素骰费用+充能费用至少为5的技能时，伤害额外+2。（每回合1次）
 * （「弓」角色才能装备。角色最多装备1件「武器」）
 */
const AmosBow = card(311204, "character")
  .costSame(3)
  .weapon("bow")
  // TODO
  .done();

/**
 * @id 311205
 * @name 终末嗟叹之诗
 * @description
 * 角色造成的伤害+1。
 * 角色使用「元素爆发」后：生成「千年的大乐章·别离之歌」。（我方角色造成的伤害+1，持续回合：2）
 * （「弓」角色才能装备。角色最多装备1件「武器」）
 */
const ElegyForTheEnd = card(311205, "character")
  .costSame(3)
  .weapon("bow")
  // TODO
  .done();

/**
 * @id 311206
 * @name 王下近侍
 * @description
 * 角色造成的伤害+1。
 * 入场时：所附属角色在本回合中，下次使用「元素战技」或装备「天赋」时少花费2个元素骰。
 * （「弓」角色才能装备。角色最多装备1件「武器」）
 */
const KingsSquire = card(311206, "character")
  .costSame(3)
  .weapon("bow")
  // TODO
  .done();

/**
 * @id 311201
 * @name 鸦羽弓
 * @description
 * 角色造成的伤害+1。
 * （「弓」角色才能装备。角色最多装备1件「武器」）
 */
const RavenBow = card(311201, "character")
  .costSame(2)
  .weapon("bow")
  // TODO
  .done();

/**
 * @id 311202
 * @name 祭礼弓
 * @description
 * 角色造成的伤害+1。
 * 角色使用「元素战技」后：生成1个此角色类型的元素骰。（每回合1次）
 * （「弓」角色才能装备。角色最多装备1件「武器」）
 */
const SacrificialBow = card(311202, "character")
  .costSame(3)
  .weapon("bow")
  // TODO
  .done();

/**
 * @id 311203
 * @name 天空之翼
 * @description
 * 角色造成的伤害+1。
 * 每回合1次：角色使用「普通攻击」造成的伤害额外+1。
 * （「弓」角色才能装备。角色最多装备1件「武器」）
 */
const SkywardHarp = card(311203, "character")
  .costSame(3)
  .weapon("bow")
  // TODO
  .done();
