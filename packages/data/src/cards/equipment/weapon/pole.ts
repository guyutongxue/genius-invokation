import { card } from "@gi-tcg/core/builder";

/**
 * @id 311405
 * @name 薙草之稻光
 * @description
 * 角色造成的伤害+1。
 * 每回合自动触发1次：如果所附属角色没有充能，就使其获得1点充能。
 * （「长柄武器」角色才能装备。角色最多装备1件「武器」）
 */
const EngulfingLightning = card(311405)
  .costSame(3)
  .weapon("pole")
  // TODO
  .done();

/**
 * @id 311402
 * @name 千岩长枪
 * @description
 * 角色造成的伤害+1。
 * 入场时：我方队伍中每有一名「璃月」角色，此牌就为附属的角色提供1点护盾。（最多3点）
 * （「长柄武器」角色才能装备。角色最多装备1件「武器」）
 */
const LithicSpear = card(311402)
  .costSame(3)
  .weapon("pole")
  // TODO
  .done();

/**
 * @id 311406
 * @name 贯月矢
 * @description
 * 角色造成的伤害+1。
 * 入场时：所附属角色在本回合中，下次使用「元素战技」或装备「天赋」时少花费2个元素骰。
 * （「长柄武器」角色才能装备。角色最多装备1件「武器」）
 */
const Moonpiercer = card(311406)
  .costSame(3)
  .weapon("pole")
  // TODO
  .done();

/**
 * @id 311403
 * @name 天空之脊
 * @description
 * 角色造成的伤害+1。
 * 每回合1次：角色使用「普通攻击」造成的伤害额外+1。
 * （「长柄武器」角色才能装备。角色最多装备1件「武器」）
 */
const SkywardSpine = card(311403)
  .costSame(3)
  .weapon("pole")
  // TODO
  .done();

/**
 * @id 311404
 * @name 贯虹之槊
 * @description
 * 角色造成的伤害+1。
 * 角色如果在护盾角色状态或护盾出战状态的保护下，则造成的伤害额外+1。
 * 角色使用「元素战技」后：如果我方存在提供「护盾」的出战状态，则为一个此类出战状态补充1点「护盾」。（每回合1次）
 * （「长柄武器」角色才能装备。角色最多装备1件「武器」）
 */
const VortexVanquisher = card(311404)
  .costSame(3)
  .weapon("pole")
  // TODO
  .done();

/**
 * @id 311401
 * @name 白缨枪
 * @description
 * 角色造成的伤害+1。
 * （「长柄武器」角色才能装备。角色最多装备1件「武器」）
 */
const WhiteTassel = card(311401)
  .costSame(2)
  .weapon("pole")
  // TODO
  .done();
