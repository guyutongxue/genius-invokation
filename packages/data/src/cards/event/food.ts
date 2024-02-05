import { DiceType, card, combatStatus } from "@gi-tcg/core/builder";
import { Satiated } from "../../commons";

/**
 * @id 333001
 * @name 绝云锅巴
 * @description
 * 本回合中，目标角色下一次「普通攻击」造成的伤害+1。
 * （每回合每个角色最多食用1次「料理」）
 */
export const JueyunGuoba = card(333001)
  .food()
  .toStatus("@targets.0")
  .once("modifySkillDamage", (c, e) => e.isSourceSkillType("normal"))
  .increaseDamage(1)
  .done();

/**
 * @id 333002
 * @name 仙跳墙
 * @description
 * 本回合中，目标角色下一次「元素爆发」造成的伤害+3。
 * （每回合每个角色最多食用1次「料理」）
 */
export const AdeptusTemptation = card(333002)
  .costVoid(2)
  .food()
  .toStatus("@targets.0")
  .once("modifySkillDamage", (c, e) => e.isSourceSkillType("burst"))
  .increaseDamage(3)
  .done();

/**
 * @id 333003
 * @name 莲花酥
 * @description
 * 本回合中，目标角色下次受到的伤害-3。
 * （每回合中每个角色最多食用1次「料理」）
 */
export const LotusFlowerCrisp = card(333003)
  .costSame(1)
  .food()
  .toStatus("@targets.0")
  .once("beforeDamaged")
  .decreaseDamage(3)
  .done();

/**
 * @id 333004
 * @name 北地烟熏鸡
 * @description
 * 本回合中，目标角色下一次「普通攻击」少花费1个无色元素。
 * （每回合每个角色最多食用1次「料理」）
 */
export const NorthernSmokedChicken = card(333004)
  .food()
  .toStatus("@targets.0")
  .oneDuration()
  .once("deductDiceSkill", (c, e) => e.isSkillType("normal") && e.canDeductCostOfType(DiceType.Void))
  .deductCost(DiceType.Void, 1)
  .done();

/**
 * @id 333005
 * @name 甜甜花酿鸡
 * @description
 * 治疗目标角色1点。
 * （每回合每个角色最多食用1次「料理」）
 */
export const SweetMadame = card(333005)
  .food()
  .heal(1, "@targets.0")
  .done();

/**
 * @id 333006
 * @name 蒙德土豆饼
 * @description
 * 治疗目标角色2点。
 * （每回合每个角色最多食用1次「料理」）
 */
export const MondstadtHashBrown = card(333006)
  .costSame(1)
  .food()
  .heal(2, "@targets.0")
  .done();

/**
 * @id 333007
 * @name 烤蘑菇披萨
 * @description
 * 治疗目标角色1点，两回合内结束阶段再治疗此角色1点。
 * （每回合每个角色最多食用1次「料理」）
 */
export const MushroomPizza = card(333007)
  .costSame(1)
  .food()
  .heal(1, "@targets.0")
  .toStatus("@targets.0")
  .on("endPhase")
  .usage(2)
  .heal(1, "@master")
  .done();

/**
 * @id 333008
 * @name 兽肉薄荷卷
 * @description
 * 目标角色在本回合结束前，之后三次「普通攻击」都少花费1个无色元素。
 * （每回合每个角色最多食用1次「料理」）
 */
export const MintyMeatRolls = card(333008)
  .costSame(1)
  .food()
  .toStatus("@targets.0")
  .oneDuration()
  .on("deductDiceSkill", (c, e) => e.isSkillType("normal") && e.canDeductCostOfType(DiceType.Void))
  .usage(3)
  .deductCost(DiceType.Void, 1)
  .done();

/**
 * @id 303307
 * @name 复苏冷却中
 * @description
 * 本回合无法通过「料理」复苏角色。
 */
export const ReviveOnCooldown = combatStatus(303307)
  .oneDuration()
  .done();

/**
 * @id 333009
 * @name 提瓦特煎蛋
 * @description
 * 复苏目标角色，并治疗此角色1点。
 * （每回合中，最多通过「料理」复苏1个角色，并且每个角色最多食用1次「料理」）
 */
export const TeyvatFriedEgg = card(333009)
  .costSame(2)
  .tags("food")
  .filter((c) => !c.$(`my combat status with definition id ${ReviveOnCooldown}`))
  .addTarget("my defeated characters")
  .heal(1, "@targets.0")
  .characterStatus(Satiated, "@targets.0")
  .combatStatus(ReviveOnCooldown)
  .done();

/**
 * @id 333010
 * @name 刺身拼盘
 * @description
 * 目标角色在本回合结束前，「普通攻击」造成的伤害+1。
 * （每回合每个角色最多食用1次「料理」）
 */
export const SashimiPlatter = card(333010)
  .costSame(1)
  .food()
  .toStatus("@targets.0")
  .oneDuration()
  .on("modifySkillDamage", (c, e) => e.isSourceSkillType("normal"))
  .increaseDamage(1)
  .done();

/**
 * @id 333011
 * @name 唐杜尔烤鸡
 * @description
 * 本回合中，所有我方角色下一次「元素战技」造成的伤害+2。
 * （每回合每个角色最多食用1次「料理」）
 */
export const TandooriRoastChicken = card(333011)
  .costVoid(2)
  .food({ satiatedTarget: "all my characters" })
  .toStatus("all my characters")
  .once("modifySkillDamage", (c, e) => e.isSourceSkillType("elemental"))
  .increaseDamage(2)
  .done();

/**
 * @id 333012
 * @name 黄油蟹蟹
 * @description
 * 本回合中，所有我方角色下次受到的伤害-2。
 * （每回合每个角色最多食用1次「料理」）
 */
export const ButterCrab = card(333012)
  .costVoid(2)
  .food({ satiatedTarget: "all my characters" })
  .toStatus("all my characters")
  .once("beforeDamaged")
  .decreaseDamage(2)
  .done();

/**
 * @id 333013
 * @name 炸鱼薯条
 * @description
 * 本回合中，所有我方角色下次使用技能时少花费1个元素骰。
 * （每回合每个角色最多食用1次「料理」）
 */
export const FishAndChips = card(333013)
  .costVoid(2)
  .food({ satiatedTarget: "all my characters" })
  .toStatus("all my characters")
  .once("deductDiceSkill")
  .deductCost(DiceType.Omni, 1)
  .done();

/**
 * @id 333014
 * @name 松茸酿肉卷
 * @description
 * 治疗目标角色2点，3回合内的结束阶段再治疗此角色1点。
 * （每回合每个角色最多食用1次「料理」）
 */
export const MatsutakeMeatRolls = card(333014)
  .costSame(2)
  .tags("food")
  .heal(2, "@targets.0")
  .toStatus("@targets.0")
  .on("endPhase")
  .usage(3)
  .heal(1, "@master")
  .done();
