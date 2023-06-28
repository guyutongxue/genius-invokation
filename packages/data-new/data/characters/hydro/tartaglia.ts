import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **断雨**
 * 造成2点物理伤害。
 */
const CuttingTorrent = createSkill(12041)
  .setType("normal")
  .costHydro(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **魔王武装·狂澜**
 * 切换为近战状态，然后造成2点水元素伤害。
 */
const FoulLegacyRagingTide = createSkill(12042)
  .setType("elemental")
  .costHydro(3)
  // TODO
  .build();

/**
 * **极恶技·尽灭闪**
 * 依据达达利亚当前所处的状态，进行不同的攻击：
 * 远程状态·魔弹一闪：造成4点水元素伤害，返还2点充能，目标角色附属断流。
 * 近战状态·尽灭水光：造成7点水元素伤害。
 */
const HavocObliteration = createSkill(12043)
  .setType("burst")
  .costHydro(3)
  .costEnergy(3)
  // TODO
  .build();

/**
 * **遏浪**
 * 【被动】战斗开始时，初始附属远程状态。
 * 角色所附属的近战状态效果结束时，重新附属远程状态。
 */
const TideWithholder = createSkill(12044)
  .setType("passive")
  // TODO
  .build();

// /**
//  * **远程状态**
//  * 
//  */
// const RangedStance = createSkill(12045)
//   .setType("passive")
  
//   // TODO
//   .build();

// /**
//  * **遏浪**
//  * 
//  */
// const TideWithholder = createSkill(12046)
//   .setType("passive")
  
//   // TODO
//   .build();

export const Tartaglia = createCharacter(1204)
  .addTags("hydro", "bow", "fatui")
  .addSkills(CuttingTorrent, FoulLegacyRagingTide, HavocObliteration, TideWithholder)
  .build();

/**
 * **深渊之灾·凝水盛放**
 * 战斗行动：我方出战角色为达达利亚时，装备此牌。
 * 达达利亚装备此牌后，立刻使用一次魔王武装·狂澜。
 * 结束阶段：对所有附属有断流的敌方角色造成1点穿透伤害。
 * （牌组中包含达达利亚，才能加入牌组）
 */
export const AbyssalMayhemHydrospout = createCard(212041)
  .setType("equipment")
  .addTags("talent", "action")
  .costHydro(4)
  // TODO
  .build();
