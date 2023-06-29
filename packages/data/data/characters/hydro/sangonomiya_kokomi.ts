import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **水有常形**
 * 造成1点水元素伤害。
 */
const TheShapeOfWater = createSkill(12051)
  .setType("normal")
  .costHydro(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **海月之誓**
 * 本角色附着水元素，召唤化海月。
 */
const KuragesOath = createSkill(12052)
  .setType("elemental")
  .costHydro(3)
  // TODO
  .build();

/**
 * **海人化羽**
 * 造成2点水元素伤害，治疗所有我方角色1点，本角色附属仪来羽衣。
 */
const NereidsAscension = createSkill(12053)
  .setType("burst")
  .costHydro(3)
  .costEnergy(2)
  // TODO
  .build();

export const SangonomiyaKokomi = createCharacter(1205)
  .addTags("hydro", "catalyst", "inazuma")
  .addSkills(TheShapeOfWater, KuragesOath, NereidsAscension)
  .build();

/**
 * **匣中玉栉**
 * 战斗行动：我方出战角色为珊瑚宫心海时，装备此牌。
 * 珊瑚宫心海装备此牌后，立刻使用一次海人化羽。
 * 装备有此牌的珊瑚宫心海使用海人化羽时：如果化海月在场，则刷新其可用次数。
 * 仪来羽衣存在期间，化海月造成的伤害+1。
 * （牌组中包含珊瑚宫心海，才能加入牌组）
 */
export const TamakushiCasket = createCard(212051)
  .setType("equipment")
  .addTags("talent", "action")
  .costHydro(3)
  .costEnergy(2)
  // TODO
  .build();
