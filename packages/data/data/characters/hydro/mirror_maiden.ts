import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **水弹**
 * 造成1点水元素伤害。
 */
const WaterBall = createSkill(22021)
  .setType("normal")
  .costHydro(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **潋波绽破**
 * 造成2点水元素伤害，目标角色附属水光破镜。
 */
const InfluxBlast = createSkill(22022)
  .setType("elemental")
  .costHydro(3)
  // TODO
  .build();

/**
 * **粼镜折光**
 * 造成5点水元素伤害。
 */
const RippledReflection = createSkill(22023)
  .setType("burst")
  .costHydro(3)
  .costEnergy(2)
  // TODO
  .build();

export const MirrorMaiden = createCharacter(2202)
  .addTags("hydro", "fatui")
  .addSkills(WaterBall, InfluxBlast, RippledReflection)
  .build();

/**
 * **镜锢之笼**
 * 战斗行动：我方出战角色为愚人众·藏镜仕女时，装备此牌。
 * 愚人众·藏镜仕女装备此牌后，立刻使用一次潋波绽破。
 * 装备有此牌的愚人众·藏镜仕女生成的水光破镜获得以下效果：
 * 初始持续回合+1，并且会使所附属角色切换到其他角色时元素骰费用+1。
 * （牌组中包含愚人众·藏镜仕女，才能加入牌组）
 */
export const MirrorCage = createCard(222021)
  .setType("equipment")
  .addTags("talent", "action")
  .costHydro(4)
  // TODO
  .build();
