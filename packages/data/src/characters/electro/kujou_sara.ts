import { character, skill, summon, status, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 114061
 * @name 天狗咒雷·伏
 * @description
 * 结束阶段：造成1点雷元素伤害，我方出战角色附属鸣煌护持。
 * 可用次数：1
 */
const TenguJuuraiAmbush = summon(114061)
  // TODO
  .done();

/**
 * @id 114062
 * @name 天狗咒雷·雷砾
 * @description
 * 结束阶段：造成2点雷元素伤害，我方出战角色附属鸣煌护持。
 * 可用次数：2
 */
const TenguJuuraiStormcluster = summon(114062)
  // TODO
  .done();

/**
 * @id 114063
 * @name 鸣煌护持
 * @description
 * 所附属角色元素战技和元素爆发造成的伤害+1。
 * 可用次数：2
 */
const CrowfeatherCover = status(114063)
  // TODO
  .done();

/**
 * @id 14061
 * @name 天狗传弓术
 * @description
 * 造成2点物理伤害。
 */
const TenguBowmanship = skill(14061)
  .type("normal")
  .costElectro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 14062
 * @name 鸦羽天狗霆雷召咒
 * @description
 * 造成1点雷元素伤害，召唤天狗咒雷·伏。
 */
const TenguStormcall = skill(14062)
  .type("elemental")
  .costElectro(3)
  // TODO
  .done();

/**
 * @id 14063
 * @name 煌煌千道镇式
 * @description
 * 造成1点雷元素伤害，召唤天狗咒雷·雷砾。
 */
const SubjugationKoukouSendou = skill(14063)
  .type("burst")
  .costElectro(4)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 1406
 * @name 九条裟罗
 * @description
 * 「此为，大义之举。」
 */
const KujouSara = character(1406)
  .tags("electro", "bow", "inazuma")
  .health(10)
  .energy(2)
  .skills(TenguBowmanship, TenguStormcall, SubjugationKoukouSendou)
  .done();

/**
 * @id 214061
 * @name 我界
 * @description
 * 战斗行动：我方出战角色为九条裟罗时，装备此牌。
 * 九条裟罗装备此牌后，立刻使用一次鸦羽天狗霆雷召咒。
 * 装备有此牌的九条裟罗在场时，我方附属有鸣煌护持的雷元素角色，元素战技和元素爆发造成的伤害额外+1。
 * （牌组中包含九条裟罗，才能加入牌组）
 */
const SinOfPride = card(214061)
  .costElectro(3)
  .talentOf(KujouSara)
  .equipment()
  // TODO
  .done();
