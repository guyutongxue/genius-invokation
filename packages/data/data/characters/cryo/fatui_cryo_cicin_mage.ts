import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **冰萤棱锥**
 * 造成1点冰元素伤害。
 */
const CicinIcicle = createSkill(21011)
  .setType("normal")
  .costCryo(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **雾虚摇唤**
 * 造成1点冰元素伤害，召唤冰萤。
 */
const MistySummons = createSkill(21012)
  .setType("elemental")
  .costCryo(3)
  // TODO
  .build();

/**
 * **冰枝白花**
 * 造成5点冰元素伤害，本角色附着冰元素，生成流萤护罩。
 */
const BlizzardBranchBlossom = createSkill(21013)
  .setType("burst")
  .costCryo(3)
  .costEnergy(3)
  // TODO
  .build();

export const FatuiCryoCicinMage = createCharacter(2101)
  .addTags("cryo", "fatui")
  .addSkills(CicinIcicle, MistySummons, BlizzardBranchBlossom)
  .build();

/**
 * **冰萤寒光**
 * 战斗行动：我方出战角色为愚人众·冰萤术士时，装备此牌。
 * 愚人众·冰萤术士装备此牌后，立刻使用一次雾虚摇唤。
 * 装备有此牌的愚人众·冰萤术士使用技能后：如果冰萤的可用次数被叠加到超过上限，则造成2点冰元素伤害。
 * （牌组中包含愚人众·冰萤术士，才能加入牌组）
 */
export const CicinsColdGlare = createCard(221011, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .costCryo(3)
  // TODO
  .build();
