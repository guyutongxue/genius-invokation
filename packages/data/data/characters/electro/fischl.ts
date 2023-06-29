import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **罪灭之矢**
 * 造成2点物理伤害。
 */
const BoltsOfDownfall = createSkill(14011)
  .setType("normal")
  .costElectro(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **夜巡影翼**
 * 造成1点雷元素伤害，召唤奥兹。
 */
const Nightrider = createSkill(14012)
  .setType("elemental")
  .costElectro(3)
  // TODO
  .build();

/**
 * **至夜幻现**
 * 造成4点雷元素伤害，对所有敌方后台角色造成2点穿透伤害。
 */
const MidnightPhantasmagoria = createSkill(14013)
  .setType("burst")
  .costElectro(3)
  .costEnergy(3)
  // TODO
  .build();

export const Fischl = createCharacter(1401)
  .addTags("electro", "bow", "mondstadt")
  .addSkills(BoltsOfDownfall, Nightrider, MidnightPhantasmagoria)
  .build();

/**
 * **噬星魔鸦**
 * 战斗行动：我方出战角色为菲谢尔时，装备此牌。
 * 菲谢尔装备此牌后，立刻使用一次夜巡影翼。
 * 装备有此牌的菲谢尔生成的奥兹，会在菲谢尔普通攻击后造成2点雷元素伤害。（需消耗可用次数）
 * （牌组中包含菲谢尔，才能加入牌组）
 */
export const StellarPredator = createCard(214011)
  .setType("equipment")
  .addTags("talent", "action")
  .costElectro(3)
  // TODO
  .build();
