import { character, skill, status, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 114034
 * @name 雷元素附魔
 * @description
 * 所附属角色造成的物理伤害变为雷元素伤害，且角色造成的雷元素伤害+1。
 * 持续回合：3
 */
const ElectroElementalInfusion01 = status(114034)
  // TODO
  .done();

/**
 * @id 114032
 * @name 雷元素附魔
 * @description
 * 所附属角色造成的物理伤害变为雷元素伤害。
 * 持续回合：2
 */
const ElectroElementalInfusion = status(114032)
  // TODO
  .done();

/**
 * @id 14031
 * @name 云来剑法
 * @description
 * 造成2点物理伤害。
 */
const YunlaiSwordsmanship = skill(14031)
  .type("normal")
  .costElectro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 14032
 * @name 星斗归位
 * @description
 * 造成3点雷元素伤害，生成手牌雷楔。
 */
const StellarRestoration = skill(14032)
  .type("elemental")
  .costElectro(3)
  // TODO
  .done();

/**
 * @id 14033
 * @name 天街巡游
 * @description
 * 造成4点雷元素伤害，对所有敌方后台角色造成3点穿透伤害。
 */
const StarwardSword = skill(14033)
  .type("burst")
  .costElectro(4)
  .costEnergy(3)
  // TODO
  .done();

/**
 * @id 1403
 * @name 刻晴
 * @description
 * 她能构筑出许多从未设想过的牌组，拿下许多难以想象的胜利。
 */
const Keqing = character(1403)
  .tags("electro", "sword", "liyue")
  .skills(YunlaiSwordsmanship, StellarRestoration, StarwardSword)
  .done();

/**
 * @id 214031
 * @name 抵天雷罚
 * @description
 * 战斗行动：我方出战角色为刻晴时，装备此牌。
 * 刻晴装备此牌后，立刻使用一次星斗归位。
 * 装备有此牌的刻晴生成的雷元素附魔获得以下效果：
 * 初始持续回合+1，并且会使所附属角色造成的雷元素伤害+1。
 * （牌组中包含刻晴，才能加入牌组）
 */
const ThunderingPenance = card(214031)
  .costElectro(3)
  .talentOf(Keqing)
  .equipment()
  // TODO
  .done();
