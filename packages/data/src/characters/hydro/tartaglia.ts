import { character, skill, status, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 112042
 * @name 近战状态
 * @description
 * 角色造成的物理伤害转换为水元素伤害。
 * 角色进行重击后：目标角色附属断流。
 * 角色对附属有断流的角色造成的伤害+1；
 * 角色对已附属有断流的角色使用技能后：对下一个敌方后台角色造成1点穿透伤害。（每回合至多2次）
 * 持续回合：2
 */
const MeleeStance = status(112042)
  // TODO
  .done();

/**
 * @id 112041
 * @name 远程状态
 * @description
 * 所附属角色进行重击后：目标角色附属断流。
 */
const RangedStance = status(112041)
  // TODO
  .done();

/**
 * @id 112043
 * @name 断流
 * @description
 * 所附属角色被击倒后：对所在阵营的出战角色附属「断流」。
 * （处于「近战状态」的达达利亚攻击所附属角色时，会造成额外伤害。）
 */
const Riptide = status(112043)
  // TODO
  .done();

/**
 * @id 12041
 * @name 断雨
 * @description
 * 造成2点物理伤害。
 */
const CuttingTorrent = skill(12041)
  .type("normal")
  .costHydro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 12042
 * @name 魔王武装·狂澜
 * @description
 * 切换为近战状态，然后造成2点水元素伤害，并使目标角色附属断流。
 */
const FoulLegacyRagingTide = skill(12042)
  .type("elemental")
  .costHydro(3)
  // TODO
  .done();

/**
 * @id 12043
 * @name 极恶技·尽灭闪
 * @description
 * 依据达达利亚当前所处的状态，进行不同的攻击：
 * 远程状态·魔弹一闪：造成5点水元素伤害，返还2点充能，目标角色附属断流。
 * 近战状态·尽灭水光：造成7点水元素伤害。
 */
const HavocObliteration = skill(12043)
  .type("burst")
  .costHydro(3)
  .costEnergy(3)
  // TODO
  .done();

/**
 * @id 12044
 * @name 遏浪
 * @description
 * 【被动】战斗开始时，初始附属远程状态。
 * 角色所附属的近战状态效果结束时，重新附属远程状态。
 */
const TideWithholder01 = skill(12044)
  .type("passive")
  // TODO
  .done();

/**
 * @id 12045
 * @name 远程状态
 * @description
 * 
 */
const RangedStanceSkill = skill(12045)
  .type("passive")
  // TODO
  .done();

/**
 * @id 12046
 * @name 遏浪
 * @description
 * 
 */
const TideWithholder = skill(12046)
  .type("passive")
  // TODO
  .done();

/**
 * @id 1204
 * @name 达达利亚
 * @description
 * 牌局亦为战场，能者方可争先。
 */
const Tartaglia = character(1204)
  .tags("hydro", "bow", "fatui")
  .skills(CuttingTorrent, FoulLegacyRagingTide, HavocObliteration, TideWithholder01, RangedStanceSkill, TideWithholder)
  .done();

/**
 * @id 212041
 * @name 深渊之灾·凝水盛放
 * @description
 * 战斗行动：我方出战角色为达达利亚时，装备此牌。
 * 达达利亚装备此牌后，立刻使用一次魔王武装·狂澜。
 * 结束阶段：装备有此牌的达达利亚在场时，如果敌方出战角色附属有断流，则对其造成1点穿透伤害。
 * （牌组中包含达达利亚，才能加入牌组）
 */
const AbyssalMayhemHydrospout = card(212041, "character")
  .costHydro(3)
  .talentOf(Tartaglia)
  .equipment()
  // TODO
  .done();
