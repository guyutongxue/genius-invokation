import { status, combatStatus, summon, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 106
 * @name 冻结
 * @description
 * 角色无法使用技能。（持续到回合结束）
 * 角色受到火元素伤害或物理伤害时，移除此效果，使该伤害+2。
 */
export const Frozen = status(106)
  .duration(1)
  .tags("disableSkill")
  .on("beforeDamaged", (c) => [DamageType.Pyro, DamageType.Physical].includes(c.damageInfo.type))
  .increaseDamage(1)
  .dispose()
  .done();

/**
 * @id 111
 * @name 结晶
 * @description
 * 为我方出战角色提供1点护盾。（可叠加，最多叠加到2点）
 */
export const Crystallize = combatStatus(111)
  .shield(1, 2)
  .done();

/**
 * @id 115
 * @name 燃烧烈焰
 * @description
 * 结束阶段：造成1点火元素伤害。
 * 可用次数：1（可叠加，最多叠加到2次）
 */
export const BurningFlame = summon(115)
  .endPhaseDamage(DamageType.Pyro, 1)
  .usage(1, { recreateMax: 2 })
  .done();

/**
 * @id 116
 * @name 草原核
 * @description
 * 我方对敌方出战角色造成火元素伤害或雷元素伤害时，伤害值+2。
 * 可用次数：1
 */
export const DendroCore = combatStatus(116)
  .on("beforeDealDamage", (c) =>
    [DamageType.Pyro, DamageType.Electro].includes(c.damageInfo.type) &&
    c.damageInfo.target.id === c.$("opp active character")!.id)
  .usage(1)
  .increaseDamage(1)
  .done();

/**
 * @id 117
 * @name 激化领域
 * @description
 * 我方对敌方出战角色造成雷元素伤害或草元素伤害时，伤害值+1。
 * 可用次数：2
 */
export const CatalyzingField = combatStatus(117)
  .on("beforeDealDamage", (c) =>
    [DamageType.Electro, DamageType.Dendro].includes(c.damageInfo.type) &&
    c.damageInfo.target.id === c.$("opp active character")!.id)
  .usage(2)
  .increaseDamage(1)
  .done();

/**
 * @id 303300
 * @name 饱腹
 * @description
 * 本回合无法食用更多「料理」
 */
export const Satiated = status(303300)
  .duration(1)
  .done();
