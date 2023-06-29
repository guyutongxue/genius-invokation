import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **雷晶投射**
 * 造成1点雷元素伤害。
 */
const ElectroCrystalProjection = createSkill(24011)
  .setType("normal")
  .costElectro(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **猜拳三连击**
 * 造成2点雷元素伤害，然后分别准备技能：猜拳三连击·剪刀和猜拳三连击·布。
 */
const RockpaperscissorsCombo = createSkill(24012)
  .setType("elemental")
  .costElectro(5)
  // TODO
  .build();

/**
 * **雳霆镇锁**
 * 造成2点雷元素伤害，召唤雷锁镇域。
 */
const LightningLockdown = createSkill(24013)
  .setType("burst")
  .costElectro(3)
  .costEnergy(2)
  // TODO
  .build();

/**
 * **雷晶核心**
 * 【被动】战斗开始时，初始附属雷晶核心。
 */
const ElectroCrystalCore = createSkill(24014)
  .setType("passive")
  // TODO
  .build();

/**
 * **猜拳三连击·剪刀**
 * 造成2点雷元素伤害，然后准备技能：猜拳三连击·布。
 */
const RockpaperscissorsComboScissors = createSkill(24015)
  .setType("elemental")
  // TODO
  .build();

/**
 * **猜拳三连击·布**
 * 造成3点雷元素伤害。
 */
const RockpaperscissorsComboPaper = createSkill(24016)
  .setType("elemental")
  // TODO
  .build();

export const ElectroHypostasis = createCharacter(2401)
  .addTags("electro", "monster")
  .addSkills(ElectroCrystalProjection, RockpaperscissorsCombo, LightningLockdown, ElectroCrystalCore, RockpaperscissorsComboScissors, RockpaperscissorsComboPaper)
  .build();

/**
 * **汲能棱晶**
 * 战斗行动：我方出战角色为无相之雷时，治疗该角色3点，并附属雷晶核心。
 * （牌组中包含无相之雷，才能加入牌组）
 */
export const AbsorbingPrism = createCard(224011)
  .setType("event")
  .addTags("talent", "action")
  .costElectro(3)
  // TODO
  .build();
