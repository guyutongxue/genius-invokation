import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **烟火打扬**
 * 造成2点物理伤害。
 */
const FireworkFlareup = createSkill(13051)
  .setType("normal")
  .costPyro(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **焰硝庭火舞**
 * 本角色附属庭火焰硝。（此技能不产生充能）
 */
const NiwabiFiredance = createSkill(13052)
  .setType("elemental", false)
  .costPyro(1)
  // TODO
  .build();

/**
 * **琉金云间草**
 * 造成4点火元素伤害，生成琉金火光。
 */
const RyuukinSaxifrage = createSkill(13053)
  .setType("burst")
  .costPyro(4)
  .costEnergy(3)
  // TODO
  .build();

export const Yoimiya = createCharacter(1305)
  .addTags("pyro", "bow", "inazuma")
  .addSkills(FireworkFlareup, NiwabiFiredance, RyuukinSaxifrage)
  .build();

/**
 * **长野原龙势流星群**
 * 战斗行动：我方出战角色为宵宫时，装备此牌。
 * 宵宫装备此牌后，立刻使用一次焰硝庭火舞。
 * 装备有此牌的宵宫触发庭火焰硝后：额外造成1点火元素伤害。
 * （牌组中包含宵宫，才能加入牌组）
 */
export const NaganoharaMeteorSwarm = createCard(213051, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .costPyro(2)
  // TODO
  .build();
