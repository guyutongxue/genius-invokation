import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **西风剑术·宗室**
 * 造成2点物理伤害。
 */
const FavoniusBladeworkEdel = createSkill(11061)
  .setType("normal")
  .costCryo(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **冰潮的涡旋**
 * 造成2点冰元素伤害，如果本角色未附属冷酷之心，则使其附属冷酷之心。
 */
const IcetideVortex = createSkill(11062)
  .setType("elemental")
  .costCryo(3)
  // TODO
  .build();

/**
 * **凝浪之光剑**
 * 造成2点冰元素伤害，召唤光降之剑。
 */
const GlacialIllumination = createSkill(11063)
  .setType("burst")
  .costCryo(3)
  .costEnergy(2)
  // TODO
  .build();

export const Eula = createCharacter(1106)
  .addTags("cryo", "claymore", "mondstadt")
  .addSkills(FavoniusBladeworkEdel, IcetideVortex, GlacialIllumination)
  .build();

/**
 * **战欲涌现**
 * 战斗行动：我方出战角色为优菈时，装备此牌。
 * 优菈装备此牌后，立刻使用一次凝浪之光剑。
 * 装备有此牌的优菈使用冰潮的涡旋时，会额外为光降之剑累积1点「能量层数」。
 * （牌组中包含优菈，才能加入牌组）
 */
export const WellspringOfWarlust = createCard(211061, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .costCryo(3)
  .costEnergy(2)
  // TODO
  .build();
