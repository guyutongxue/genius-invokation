import { character, skill, summon, combatStatus, card, DamageType } from "@gi-tcg";

/**
 * @id 111023
 * @name 酒雾领域
 * @description
 * 结束阶段：造成1点冰元素伤害，治疗我方出战角色2点。
 * 可用次数：2
 */
const DrunkenMist = summon(111023)
  // TODO
  .done();

/**
 * @id 111022
 * @name 猫爪护盾
 * @description
 * 为我方出战角色提供2点护盾。
 */
const CatclawShield = combatStatus(111022)
  // TODO
  .done();

/**
 * @id 111021
 * @name 猫爪护盾
 * @description
 * 为我方出战角色提供1点护盾。
 */
const CatclawShield = combatStatus(111021)
  // TODO
  .done();

/**
 * @id 11021
 * @name 猎人射术
 * @description
 * 造成2点物理伤害。
 */
const KatzleinStyle = skill(11021)
  .type("normal")
  .costCryo(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 11022
 * @name 猫爪冻冻
 * @description
 * 造成2点冰元素伤害，生成猫爪护盾。
 */
const IcyPaws = skill(11022)
  .type("elemental")
  .costCryo(3)
  // TODO
  .done();

/**
 * @id 11023
 * @name 最烈特调
 * @description
 * 造成1点冰元素伤害，治疗此角色2点，召唤酒雾领域。
 */
const SignatureMix = skill(11023)
  .type("burst")
  .costCryo(3)
  .costEnergy(3)
  // TODO
  .done();

/**
 * @id 1102
 * @name 迪奥娜
 * @description
 * 用1%的力气调酒，99%的力气…拒绝失败。
 */
const Diona = character(1102)
  .tags("cryo", "bow", "mondstadt")
  .skills(KatzleinStyle, IcyPaws, SignatureMix)
  .done();

/**
 * @id 211021
 * @name 猫爪冰摇
 * @description
 * 战斗行动：我方出战角色为迪奥娜时，装备此牌。
 * 迪奥娜装备此牌后，立刻使用一次猫爪冻冻。
 * 装备有此牌的迪奥娜生成的猫爪护盾，所提供的护盾值+1。
 * （牌组中包含迪奥娜，才能加入牌组）
 */
const ShakenNotPurred = card(211021, "character")
  .costCryo(3)
  .talentOf(Diona)
  .equipment()
  // TODO
  .done();
