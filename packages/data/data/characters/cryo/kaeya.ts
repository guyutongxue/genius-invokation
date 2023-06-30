import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **仪典剑术**
 * 造成2点物理伤害。
 */
const CeremonialBladework = createSkill(11031)
  .setType("normal")
  .costCryo(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **霜袭**
 * 造成3点冰元素伤害。
 */
const Frostgnaw = createSkill(11032)
  .setType("elemental")
  .costCryo(3)
  // TODO
  .build();

/**
 * **凛冽轮舞**
 * 造成1点冰元素伤害，生成寒冰之棱。
 */
const GlacialWaltz = createSkill(11033)
  .setType("burst")
  .costCryo(4)
  .costEnergy(2)
  // TODO
  .build();

export const Kaeya = createCharacter(1103)
  .addTags("cryo", "sword", "mondstadt")
  .addSkills(CeremonialBladework, Frostgnaw, GlacialWaltz)
  .build();

/**
 * **冷血之剑**
 * 战斗行动：我方出战角色为凯亚时，装备此牌。
 * 凯亚装备此牌后，立刻使用一次霜袭。
 * 装备有此牌的凯亚使用霜袭后：治疗自身2点。（每回合1次）
 * （牌组中包含凯亚，才能加入牌组）
 */
export const ColdbloodedStrike = createCard(211031, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .costCryo(4)
  // TODO
  .build();
