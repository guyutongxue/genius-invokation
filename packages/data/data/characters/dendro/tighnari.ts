import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **藏蕴破障**
 * 造成2点物理伤害。
 */
const KhandaBarrierbuster = createSkill(17021)
  .setType("normal")
  .costDendro(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **识果种雷**
 * 造成2点草元素伤害，本角色附属通塞识。
 */
const VijnanaphalaMine = createSkill(17022)
  .setType("elemental")
  .costDendro(3)
  // TODO
  .build();

/**
 * **造生缠藤箭**
 * 造成4点草元素伤害，对所有敌方后台角色造成1点穿透伤害。
 */
const FashionersTanglevineShaft = createSkill(17023)
  .setType("burst")
  .costDendro(3)
  .costEnergy(2)
  // TODO
  .build();

export const Tighnari = createCharacter(1702)
  .addTags("dendro", "bow", "sumeru")
  .maxEnergy(2)
  .addSkills(KhandaBarrierbuster, VijnanaphalaMine, FashionersTanglevineShaft)
  .build();

/**
 * **眼识殊明**
 * 战斗行动：我方出战角色为提纳里时，装备此牌。
 * 提纳里装备此牌后，立刻使用一次识果种雷。
 * 装备有此牌的提纳里在附属通塞识状态期间，进行重击时少花费1个无色元素。
 * （牌组中包含提纳里，才能加入牌组）
 */
export const KeenSight = createCard(217021, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .costDendro(4)
  // TODO
  .build();
