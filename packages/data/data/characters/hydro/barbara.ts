import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **水之浅唱**
 * 造成1点水元素伤害。
 */
const WhisperOfWater = createSkill(12011)
  .setType("normal")
  .costHydro(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **演唱，开始♪**
 * 造成1点水元素伤害，召唤歌声之环。
 */
const LetTheShowBegin = createSkill(12012)
  .setType("elemental")
  .costHydro(3)
  // TODO
  .build();

/**
 * **闪耀奇迹♪**
 * 治疗所有我方角色4点。
 */
const ShiningMiracle = createSkill(12013)
  .setType("burst")
  .costHydro(3)
  .costEnergy(3)
  // TODO
  .build();

export const Barbara = createCharacter(1201)
  .addTags("hydro", "catalyst", "mondstadt")
  .addSkills(WhisperOfWater, LetTheShowBegin, ShiningMiracle)
  .build();

/**
 * **光辉的季节**
 * 战斗行动：我方出战角色为芭芭拉时，装备此牌。
 * 芭芭拉装备此牌后，立刻使用一次演唱，开始♪。
 * 装备有此牌的芭芭拉在场时，歌声之环会使我方执行「切换角色」行动时少花费1个元素骰。（每回合1次）
 * （牌组中包含芭芭拉，才能加入牌组）
 */
export const GloriousSeason = createCard(212011)
  .setType("equipment")
  .addTags("talent", "action")
  .costHydro(4)
  // TODO
  .build();
