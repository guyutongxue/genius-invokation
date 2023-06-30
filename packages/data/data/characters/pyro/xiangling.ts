import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **白案功夫**
 * 造成2点物理伤害。
 */
const DoughFu = createSkill(13021)
  .setType("normal")
  .costPyro(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **锅巴出击**
 * 召唤锅巴。
 */
const GuobaAttack = createSkill(13022)
  .setType("elemental")
  .costPyro(3)
  // TODO
  .build();

/**
 * **旋火轮**
 * 造成2点火元素伤害，生成旋火轮。
 */
const Pyronado = createSkill(13023)
  .setType("burst")
  .costPyro(4)
  .costEnergy(2)
  // TODO
  .build();

export const Xiangling = createCharacter(1302)
  .addTags("pyro", "pole", "liyue")
  .addSkills(DoughFu, GuobaAttack, Pyronado)
  .build();

/**
 * **交叉火力**
 * 战斗行动：我方出战角色为香菱时，装备此牌。
 * 香菱装备此牌后，立刻使用一次锅巴出击。
 * 装备有此牌的香菱施放锅巴出击时，自身也会造成1点火元素伤害。
 * （牌组中包含香菱，才能加入牌组）
 */
export const Crossfire = createCard(213021, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .costPyro(4)
  // TODO
  .build();
