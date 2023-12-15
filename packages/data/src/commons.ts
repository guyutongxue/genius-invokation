import { status, combatStatus, summon, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 106
 * @name 冻结
 * @description
 * 角色无法使用技能。（持续到回合结束）
 * 角色受到火元素伤害或物理伤害时，移除此效果，使该伤害+2。
 */
const Frozen = status(106)
  .duration(1)
  .tags("disableSkill")
  .on("beforeDamaged")
  .if((c) => c.damageInfo.type === DamageType.Pyro || c.damageInfo.type === DamageType.Physical)
  .do((c) => {
    c.increaseDamage(1);
    c.caller().dispose();
    return true;
  })
  .done();

/**
 * @id 111
 * @name 结晶
 * @description
 * 为我方出战角色提供1点护盾。（可叠加，最多叠加到2点）
 */
const Crystallize = combatStatus(111)
  .shield(1, 2) //
  .done();

/**
 * @id 115
 * @name 燃烧烈焰
 * @description
 * 结束阶段：造成1点火元素伤害。
 * 可用次数：1（可叠加，最多叠加到2次）
 */
const BurningFlame = summon(115)
  .on("endPhase")
  .usage(1, { recreateMax: 2 })
  .damage(1, DamageType.Pyro)
  .done();

/**
 * @id 116
 * @name 草原核
 * @description
 * 我方对敌方出战角色造成火元素伤害或雷元素伤害时，伤害值+2。
 * 可用次数：1
 */
const DendroCore = combatStatus(116)
  .on("beforeDealDamage")
  .usage(1)
  .if(
    (c) =>
      [DamageType.Pyro, DamageType.Electro].includes(c.damageInfo.type) &&
      c.damageInfo.target.id === c.$("opp active character")!.id,
  )
  .increaseDamage(1)
  .done();

/**
 * @id 117
 * @name 激化领域
 * @description
 * 我方对敌方出战角色造成雷元素伤害或草元素伤害时，伤害值+1。
 * 可用次数：2
 */
const CatalyzingField = combatStatus(117)
  .on("beforeDealDamage")
  .usage(2)
  .if(
    (c) =>
      [DamageType.Electro, DamageType.Dendro].includes(c.damageInfo.type) &&
      c.damageInfo.target.id === c.$("opp active character")!.id,
  )
  .increaseDamage(1)
  .done();
