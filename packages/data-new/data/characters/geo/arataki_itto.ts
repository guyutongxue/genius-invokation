import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **喧哗屋传说**
 * 造成2点物理伤害。
 */
const FightClubLegend = createSkill(16051)
  .setType("normal")
  .costGeo(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **魔杀绝技·赤牛发破！**
 * 造成1点岩元素伤害，召唤阿丑，本角色附属乱神之怪力。
 */
const MasatsuZetsugiAkaushiBurst = createSkill(16052)
  .setType("elemental")
  .costGeo(3)
  // TODO
  .build();

/**
 * **最恶鬼王·一斗轰临！！**
 * 造成5点岩元素伤害，本角色附属怒目鬼王。
 */
const RoyalDescentBeholdIttoTheEvil = createSkill(16053)
  .setType("burst")
  .costGeo(3)
  .costEnergy(3)
  // TODO
  .build();

export const AratakiItto = createCharacter(1605)
  .addTags("geo", "claymore", "inazuma")
  .addSkills(FightClubLegend, MasatsuZetsugiAkaushiBurst, RoyalDescentBeholdIttoTheEvil)
  .build();

/**
 * **荒泷第一**
 * 战斗行动：我方出战角色为荒泷一斗时，装备此牌。
 * 荒泷一斗装备此牌后，立刻使用一次喧哗屋传说。
 * 装备有此牌的荒泷一斗每回合第2次及以后使用喧哗屋传说时：如果触发乱神之怪力，伤害额外+1。
 * （牌组中包含荒泷一斗，才能加入牌组）
 */
export const AratakiIchiban = createCard(216051)
  .setType("equipment")
  .addTags("talent", "action")
  .costGeo(1)
  .costVoid(2)
  // TODO
  .build();
