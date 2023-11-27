import { character, skill, status, card, DamageType } from "@gi-tcg";

/**
 * @id 115042
 * @name 降魔·忿怒显相
 * @description
 * 所附属角色使用风轮两立时：少花费1个风元素。
 * 可用次数：2
 * 所附属角色不再附属夜叉傩面时：移除此效果。
 */
const ConquerorOfEvilWrathDeity = status(115042)
  // TODO
  .done();

/**
 * @id 115041
 * @name 夜叉傩面
 * @description
 * 所附属角色造成的物理伤害变为风元素伤害，且角色造成的风元素伤害+1。
 * 所附属角色进行下落攻击时：伤害额外+2。
 * 所附属角色为出战角色，我方执行「切换角色」行动时：少花费1个元素骰。（每回合1次）
 * 持续回合：2
 */
const YakshasMask = status(115041)
  // TODO
  .done();

/**
 * @id 15041
 * @name 卷积微尘
 * @description
 * 造成2点物理伤害。
 */
const WhirlwindThrust = skill(15041)
  .type("normal")
  .costAnemo(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 15042
 * @name 风轮两立
 * @description
 * 造成3点风元素伤害。
 */
const LemniscaticWindCycling = skill(15042)
  .type("elemental")
  .costAnemo(3)
  // TODO
  .done();

/**
 * @id 15043
 * @name 靖妖傩舞
 * @description
 * 造成4点风元素伤害，本角色附属夜叉傩面。
 */
const BaneOfAllEvil = skill(15043)
  .type("burst")
  .costAnemo(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 1504
 * @name 魈
 * @description
 * 护法夜叉，靖妖降魔。
 */
const Xiao = character(1504)
  .tags("anemo", "pole", "liyue")
  .skills(WhirlwindThrust, LemniscaticWindCycling, BaneOfAllEvil)
  .done();

/**
 * @id 215041
 * @name 降魔·护法夜叉
 * @description
 * 战斗行动：我方出战角色为魈时，装备此牌。
 * 魈装备此牌后，立刻使用一次靖妖傩舞。
 * 装备有此牌的魈附属夜叉傩面期间，使用风轮两立时少花费1个风元素。（每附属1次夜叉傩面，可触发2次）
 * （牌组中包含魈，才能加入牌组）
 */
const ConquerorOfEvilGuardianYaksha = card(215041, "character")
  .costAnemo(3)
  .costEnergy(2)
  .talentOf(Xiao)
  .equipment()
  // TODO
  .done();
