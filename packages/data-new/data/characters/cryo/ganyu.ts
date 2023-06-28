import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **流天射术**
 * 造成2点物理伤害。
 */
const LiutianArchery = createSkill(11011)
  .setType("normal")
  .costCryo(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **山泽麟迹**
 * 造成1点冰元素伤害，生成冰莲。
 */
const TrailOfTheQilin = createSkill(11012)
  .setType("elemental")
  .costCryo(3)
  // TODO
  .build();

/**
 * **霜华矢**
 * 造成2点冰元素伤害，对所有敌方后台角色造成2点穿透伤害。
 */
const FrostflakeArrow = createSkill(11013)
  .setType("normal")
  .costCryo(5)
  // TODO
  .build();

/**
 * **降众天华**
 * 造成2点冰元素伤害，对所有敌方后台角色造成1点穿透伤害，召唤冰灵珠。
 */
const CelestialShower = createSkill(11014)
  .setType("burst")
  .costCryo(3)
  .costEnergy(3)
  // TODO
  .build();

export const Ganyu = createCharacter(1101)
  .addTags("cryo", "bow", "liyue")
  .addSkills(LiutianArchery, TrailOfTheQilin, FrostflakeArrow, CelestialShower)
  .build();

/**
 * **唯此一心**
 * 战斗行动：我方出战角色为甘雨时，装备此牌。
 * 甘雨装备此牌后，立刻使用一次霜华矢。
 * 装备有此牌的甘雨使用霜华矢时：如果此技能在本场对局中曾经被使用过，则其对敌方后台角色造成的穿透伤害改为3点。
 * （牌组中包含甘雨，才能加入牌组）
 */
export const UndividedHeart = createCard(211011)
  .setType("equipment")
  .addTags("talent", "action")
  .costCryo(5)
  // TODO
  .build();
