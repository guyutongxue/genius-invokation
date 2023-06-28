import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **古华剑法**
 * 造成2点物理伤害。
 */
const GuhuaStyle = createSkill(12021)
  .setType("normal")
  .costHydro(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **画雨笼山**
 * 造成2点水元素伤害，本角色附着水元素，生成雨帘剑。
 */
const FatalRainscreen = createSkill(12022)
  .setType("elemental")
  .costHydro(3)
  // TODO
  .build();

/**
 * **裁雨留虹**
 * 造成1点水元素伤害，本角色附着水元素，生成虹剑势。
 */
const Raincutter = createSkill(12023)
  .setType("burst")
  .costHydro(3)
  .costEnergy(2)
  // TODO
  .build();

export const Xingqiu = createCharacter(1202)
  .addTags("hydro", "sword", "liyue")
  .addSkills(GuhuaStyle, FatalRainscreen, Raincutter)
  .build();

/**
 * **重帘留香**
 * 战斗行动：我方出战角色为行秋时，装备此牌。
 * 行秋装备此牌后，立刻使用一次画雨笼山。
 * 装备有此牌的行秋生成的雨帘剑，初始可用次数+1。
 * （牌组中包含行秋，才能加入牌组）
 */
export const TheScentRemained = createCard(212021, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .costHydro(4)
  // TODO
  .build();
