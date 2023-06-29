import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **翻涌**
 * 造成1点水元素伤害。
 */
const Surge = createSkill(22011)
  .setType("normal")
  .costHydro(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **纯水幻造**
 * 随机召唤1种纯水幻形。（优先生成不同的类型）
 */
const OceanidMimicSummoning = createSkill(22012)
  .setType("elemental")
  .costHydro(3)
  // TODO
  .build();

/**
 * **林野百态**
 * 随机召唤2种纯水幻形。（优先生成不同的类型）
 */
const TheMyriadWilds = createSkill(22013)
  .setType("elemental")
  .costHydro(5)
  // TODO
  .build();

/**
 * **潮涌与激流**
 * 造成2点水元素伤害；我方每有1个召唤物，再使此伤害+2。
 */
const TideAndTorrent = createSkill(22014)
  .setType("burst")
  .costHydro(3)
  .costEnergy(3)
  // TODO
  .build();

export const RhodeiaOfLoch = createCharacter(2201)
  .addTags("hydro", "monster")
  .addSkills(Surge, OceanidMimicSummoning, TheMyriadWilds, TideAndTorrent)
  .build();

/**
 * **百川奔流**
 * 战斗行动：我方出战角色为纯水精灵·洛蒂娅时，装备此牌。
 * 纯水精灵·洛蒂娅装备此牌后，立刻使用一次潮涌与激流。
 * 装备有此牌的纯水精灵·洛蒂娅施放潮涌与激流时，使我方所有召唤物可用次数+1。
 * （牌组中包含纯水精灵·洛蒂娅，才能加入牌组）
 */
export const StreamingSurge = createCard(222011)
  .setType("equipment")
  .addTags("talent", "action")
  .costHydro(4)
  .costEnergy(3)
  // TODO
  .build();
