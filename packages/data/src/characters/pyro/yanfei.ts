import { character, skill, status, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 113082
 * @name 灼灼
 * @description
 * 角色进行重击时：少花费1个火元素。（每回合1次）
 * 结束阶段：角色附属丹火印。
 * 持续回合：2
 */
const Brilliance = status(113082)
  // TODO
  .done();

/**
 * @id 113081
 * @name 丹火印
 * @description
 * 角色进行重击时：造成的伤害+2。
 * 可用次数：1（可叠加，最多叠加到2次）
 */
const ScarletSeal = status(113081)
  // TODO
  .done();

/**
 * @id 13081
 * @name 火漆制印
 * @description
 * 造成1点火元素伤害。
 */
const SealOfApproval = skill(13081)
  .type("normal")
  .costPyro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 13082
 * @name 丹书立约
 * @description
 * 造成3点火元素伤害，本角色附属丹火印。
 */
const SignedEdict = skill(13082)
  .type("elemental")
  .costPyro(3)
  // TODO
  .done();

/**
 * @id 13083
 * @name 凭此结契
 * @description
 * 造成3点火元素伤害，本角色附属丹火印和灼灼。
 */
const DoneDeal = skill(13083)
  .type("burst")
  .costPyro(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 1308
 * @name 烟绯
 * @description
 * 不期修古，不法常可。
 */
const Yanfei = character(1308)
  .tags("pyro", "catalyst", "liyue")
  .skills(SealOfApproval, SignedEdict, DoneDeal)
  .done();

/**
 * @id 213081
 * @name 最终解释权
 * @description
 * 战斗行动：我方出战角色为烟绯时，装备此牌。
 * 烟绯装备此牌后，立刻使用一次火漆制印。
 * 装备有此牌的烟绯进行重击时：对生命值不多于6的敌人造成的伤害+1；如果触发了丹火印，则在技能结算后抓1张牌。
 * （牌组中包含烟绯，才能加入牌组）
 */
const RightOfFinalInterpretation = card(213081, "character")
  .costPyro(1)
  .costVoid(2)
  .talentOf(Yanfei)
  .equipment()
  // TODO
  .done();
