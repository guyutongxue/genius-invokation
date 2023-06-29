import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **天狗传弓术**
 * 造成2点物理伤害。
 */
const TenguBowmanship = createSkill(14061)
  .setType("normal")
  .costElectro(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **鸦羽天狗霆雷召咒**
 * 造成1点雷元素伤害，召唤天狗咒雷·伏。
 */
const TenguStormcall = createSkill(14062)
  .setType("elemental")
  .costElectro(3)
  // TODO
  .build();

/**
 * **煌煌千道镇式**
 * 造成1点雷元素伤害，召唤天狗咒雷·雷砾。
 */
const SubjugationKoukouSendou = createSkill(14063)
  .setType("burst")
  .costElectro(4)
  .costEnergy(2)
  // TODO
  .build();

export const KujouSara = createCharacter(1406)
  .addTags("electro", "bow", "inazuma")
  .addSkills(TenguBowmanship, TenguStormcall, SubjugationKoukouSendou)
  .build();

/**
 * **我界**
 * 战斗行动：我方出战角色为九条裟罗时，装备此牌。
 * 九条裟罗装备此牌后，立刻使用一次煌煌千道镇式。
 * 装备有此牌的九条裟罗在场时，我方附属有鸣煌护持的雷元素角色，元素战技和元素爆发造成的伤害额外+1。
 * （牌组中包含九条裟罗，才能加入牌组）
 */
export const SinOfPride = createCard(214061)
  .setType("equipment")
  .addTags("talent", "action")
  .costElectro(4)
  .costEnergy(2)
  // TODO
  .build();
