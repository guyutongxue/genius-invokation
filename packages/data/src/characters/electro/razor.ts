import { character, skill, status, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 114021
 * @name 雷狼
 * @description
 * 所附属角色使用普通攻击或元素战技后：造成2点雷元素伤害。
 * 持续回合：2
 */
const TheWolfWithin = status(114021)
  // TODO
  .done();

/**
 * @id 14021
 * @name 钢脊
 * @description
 * 造成2点物理伤害。
 */
const SteelFang = skill(14021)
  .type("normal")
  .costElectro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 14022
 * @name 利爪与苍雷
 * @description
 * 造成3点雷元素伤害。
 */
const ClawAndThunder = skill(14022)
  .type("elemental")
  .costElectro(3)
  // TODO
  .done();

/**
 * @id 14023
 * @name 雷牙
 * @description
 * 造成3点雷元素伤害，本角色附属雷狼。
 */
const LightningFang = skill(14023)
  .type("burst")
  .costElectro(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 1402
 * @name 雷泽
 * @description
 * 「牌，难。」
 * 「但，有朋友…」
 */
const Razor = character(1402)
  .tags("electro", "claymore", "mondstadt")
  .health(10)
  .energy(2)
  .skills(SteelFang, ClawAndThunder, LightningFang)
  .done();

/**
 * @id 214021
 * @name 觉醒
 * @description
 * 战斗行动：我方出战角色为雷泽时，装备此牌。
 * 雷泽装备此牌后，立刻使用一次利爪与苍雷。
 * 装备有此牌的雷泽使用利爪与苍雷后：使我方一个雷元素角色获得1点充能。（每回合1次，出战角色优先）
 * （牌组中包含雷泽，才能加入牌组）
 */
const Awakening = card(214021)
  .costElectro(3)
  .talent(Razor)
  // TODO
  .done();
