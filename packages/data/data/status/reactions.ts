import { DamageType, createStatus, createSummon } from "@gi-tcg"

/**
 * **激化领域**
 * 我方对敌方出战角色造成雷元素伤害或草元素伤害时，伤害值+1。
 * 可用次数：2
 */
export const CatalyzingField = createStatus(117)
  .withUsage(2)
  .on("beforeDealDamage", (c) => {
    if ((c.damageType === DamageType.Electro || c.damageType === DamageType.Dendro)
      && c.target.isActive()
      && !c.target.isMine()) {
      c.addDamage(1);
    } else {
      return false;
    }
  })
  .build();

/**
 * **草原核**
 * 我方对敌方出战角色造成火元素伤害或雷元素伤害时，伤害值+2。
 * 可用次数：1
 */
export const DendroCore = createStatus(116)
.withUsage(1)
.on("beforeDealDamage", (c) => {
  if ((c.damageType === DamageType.Pyro || c.damageType === DamageType.Electro)
    && c.target.isActive()
    && !c.target.isMine()) {
    c.addDamage(2);
  } else {
    return false;
  }
})
.build();

/**
 * **燃烧烈焰**
 * 结束阶段：造成1点火元素伤害。
 * 可用次数：1（可叠加，最多叠加到2次）
 */
export const BurningFlame = createSummon(115)
  .withUsage(1, 2)
  .on("endPhase", (c) => {
    c.dealDamage(1, DamageType.Pyro);
  })
  .build();
