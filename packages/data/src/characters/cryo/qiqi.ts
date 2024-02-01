import { character, skill, summon, combatStatus, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 111081
 * @name 寒病鬼差
 * @description
 * 结束阶段：造成1点冰元素伤害。
 * 可用次数：3
 * 此召唤物在场时，七七使用「普通攻击」后：治疗受伤最多的我方角色1点。
 */
export const HeraldOfFrost = summon(111081)
  // TODO
  .done();

/**
 * @id 111082
 * @name 度厄真符
 * @description
 * 我方角色使用技能后：如果该角色生命值未满，则治疗该角色2点。
 * 可用次数：3
 */
export const FortunepreservingTalisman = combatStatus(111082)
  // TODO
  .done();

/**
 * @id 11081
 * @name 云来古剑法
 * @description
 * 造成2点物理伤害。
 */
export const AncientSwordArt = skill(11081)
  .type("normal")
  .costCryo(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 11082
 * @name 仙法·寒病鬼差
 * @description
 * 召唤寒病鬼差。
 */
export const AdeptusArtHeraldOfFrost = skill(11082)
  .type("elemental")
  .costCryo(3)
  // TODO
  .done();

/**
 * @id 11083
 * @name 仙法·救苦度厄
 * @description
 * 造成3点冰元素伤害，生成度厄真符。
 */
export const AdeptusArtPreserverOfFortune = skill(11083)
  .type("burst")
  .costCryo(3)
  .costEnergy(3)
  // TODO
  .done();

/**
 * @id 1108
 * @name 七七
 * @description
 * 流转不息，生生不绝。
 */
export const Qiqi = character(1108)
  .tags("cryo", "sword", "liyue")
  .health(10)
  .energy(3)
  .skills(AncientSwordArt, AdeptusArtHeraldOfFrost, AdeptusArtPreserverOfFortune)
  .done();

/**
 * @id 211081
 * @name 起死回骸
 * @description
 * 战斗行动：我方出战角色为七七时，装备此牌。
 * 七七装备此牌后，立刻使用一次仙法·救苦度厄。
 * 装备有此牌的七七使用仙法·救苦度厄时：复苏我方所有倒下的角色，并治疗其2点。（整场牌局限制2次）
 * （牌组中包含七七，才能加入牌组）
 */
export const RiteOfResurrection = card(211081)
  .costCryo(5)
  .costEnergy(3)
  .talent(Qiqi)
  // TODO
  .done();
