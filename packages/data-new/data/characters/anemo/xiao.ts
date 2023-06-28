import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **卷积微尘**
 * 造成2点物理伤害。
 */
const WhirlwindThrust = createSkill(15041)
  .setType("normal")
  .costAnemo(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **风轮两立**
 * 造成3点风元素伤害。
 */
const LemniscaticWindCycling = createSkill(15042)
  .setType("elemental")
  .costAnemo(3)
  // TODO
  .build();

/**
 * **靖妖傩舞**
 * 造成4点风元素伤害，本角色附属夜叉傩面。
 */
const BaneOfAllEvil = createSkill(15043)
  .setType("burst")
  .costAnemo(3)
  .costEnergy(2)
  // TODO
  .build();

export const Xiao = createCharacter(1504)
  .addTags("anemo", "pole", "liyue")
  .addSkills(WhirlwindThrust, LemniscaticWindCycling, BaneOfAllEvil)
  .build();

/**
 * **降魔·护法夜叉**
 * 战斗行动：我方出战角色为魈时，装备此牌。
 * 魈装备此牌后，立刻使用一次靖妖傩舞。
 * 装备有此牌的魈附属夜叉傩面期间，使用风轮两立时少花费1个风元素。（每附属1次夜叉傩面，可触发2次）
 * （牌组中包含魈，才能加入牌组）
 */
export const ConquerorOfEvilGuardianYaksha = createCard(215041, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .costAnemo(3)
  .costEnergy(2)
  // TODO
  .build();
