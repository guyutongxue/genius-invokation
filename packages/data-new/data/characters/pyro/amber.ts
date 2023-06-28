import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **神射手**
 * 造成2点物理伤害。
 */
const Sharpshooter = createSkill(13041)
  .setType("normal")
  .costPyro(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **爆弹玩偶**
 * 召唤兔兔伯爵。
 */
const ExplosivePuppet = createSkill(13042)
  .setType("elemental")
  .costPyro(3)
  // TODO
  .build();

/**
 * **箭雨**
 * 造成2点火元素伤害，对所有敌方后台角色造成2点穿透伤害。
 */
const FieryRain = createSkill(13043)
  .setType("burst")
  .costPyro(3)
  .costEnergy(2)
  // TODO
  .build();

export const Amber = createCharacter(1304)
  .addTags("pyro", "bow", "mondstadt")
  .addSkills(Sharpshooter, ExplosivePuppet, FieryRain)
  .build();

/**
 * **一触即发**
 * 战斗行动：我方出战角色为安柏时，装备此牌。
 * 安柏装备此牌后，立刻使用一次爆弹玩偶。
 * 安柏普通攻击后：如果此牌和兔兔伯爵仍在场，则引爆兔兔伯爵，造成3点火元素伤害。
 * （牌组中包含安柏，才能加入牌组）
 */
export const BunnyTriggered = createCard(213041, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .costPyro(3)
  // TODO
  .build();
