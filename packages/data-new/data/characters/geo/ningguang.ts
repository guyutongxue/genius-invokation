import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **千金掷**
 * 造成1点岩元素伤害。
 */
const SparklingScatter = createSkill(16011)
  .setType("normal")
  .costGeo(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **璇玑屏**
 * 造成2点岩元素伤害，生成璇玑屏。
 */
const JadeScreen = createSkill(16012)
  .setType("elemental")
  .costGeo(3)
  // TODO
  .build();

/**
 * **天权崩玉**
 * 造成6点岩元素伤害；如果璇玑屏在场，就使此伤害+2。
 */
const Starshatter = createSkill(16013)
  .setType("burst")
  .costGeo(3)
  .costEnergy(3)
  // TODO
  .build();

export const Ningguang = createCharacter(1601)
  .addTags("geo", "catalyst", "liyue")
  .addSkills(SparklingScatter, JadeScreen, Starshatter)
  .build();

/**
 * **储之千日，用之一刻**
 * 战斗行动：我方出战角色为凝光时，装备此牌。
 * 凝光装备此牌后，立刻使用一次璇玑屏。
 * 装备有此牌的凝光在场时，璇玑屏会使我方造成的岩元素伤害+1。
 * （牌组中包含凝光，才能加入牌组）
 */
export const StrategicReserve = createCard(216011)
  .setType("equipment")
  .addTags("talent", "action")
  .costGeo(4)
  // TODO
  .build();
