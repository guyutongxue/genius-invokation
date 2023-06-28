import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **西风剑术·女仆**
 * 造成2点物理伤害。
 */
const FavoniusBladeworkMaid = createSkill(16021)
  .setType("normal")
  .costGeo(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **护心铠**
 * 造成1点岩元素伤害，生成护体岩铠。
 */
const Breastplate = createSkill(16022)
  .setType("elemental")
  .costGeo(3)
  // TODO
  .build();

/**
 * **大扫除**
 * 造成4点岩元素伤害，本角色附属大扫除。
 */
const SweepingTime = createSkill(16023)
  .setType("burst")
  .costGeo(4)
  .costEnergy(2)
  // TODO
  .build();

export const Noelle = createCharacter(1602)
  .addTags("geo", "claymore", "mondstadt")
  .addSkills(FavoniusBladeworkMaid, Breastplate, SweepingTime)
  .build();

/**
 * **支援就交给我吧**
 * 战斗行动：我方出战角色为诺艾尔时，装备此牌。
 * 诺艾尔装备此牌后，立刻使用一次护心铠。
 * 装备有此牌的诺艾尔生成的护体岩铠，会在诺艾尔使用普通攻击后，治疗我方所有角色1点。（每回合1次）
 * （牌组中包含诺艾尔，才能加入牌组）
 */
export const IGotYourBack = createCard(216021, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .costGeo(3)
  // TODO
  .build();
