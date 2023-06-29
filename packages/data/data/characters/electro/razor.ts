import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **钢脊**
 * 造成2点物理伤害。
 */
const SteelFang = createSkill(14021)
  .setType("normal")
  .costElectro(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **利爪与苍雷**
 * 造成3点雷元素伤害。
 */
const ClawAndThunder = createSkill(14022)
  .setType("elemental")
  .costElectro(3)
  // TODO
  .build();

/**
 * **雷牙**
 * 造成5点雷元素伤害，本角色附属雷狼。
 */
const LightningFang = createSkill(14023)
  .setType("burst")
  .costElectro(3)
  .costEnergy(3)
  // TODO
  .build();

export const Razor = createCharacter(1402)
  .addTags("electro", "claymore", "mondstadt")
  .addSkills(SteelFang, ClawAndThunder, LightningFang)
  .build();

/**
 * **觉醒**
 * 战斗行动：我方出战角色为雷泽时，装备此牌。
 * 雷泽装备此牌后，立刻使用一次利爪与苍雷。
 * 装备有此牌的雷泽使用利爪与苍雷后：使我方一个雷元素角色获得1点充能。（出战角色优先）
 * （牌组中包含雷泽，才能加入牌组）
 */
export const Awakening = createCard(214021)
  .setType("equipment")
  .addTags("talent", "action")
  .costElectro(4)
  // TODO
  .build();
