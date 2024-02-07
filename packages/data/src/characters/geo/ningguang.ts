import { character, skill, combatStatus, card, DamageType, CombatStatusHandle } from "@gi-tcg/core/builder";

/**
 * @id 116011
 * @name 璇玑屏
 * @description
 * 我方出战角色受到至少为2的伤害时：抵消1点伤害。
 * 可用次数：2
 */
export const JadeScreenStatus: CombatStatusHandle = combatStatus(116011)
  .on("beforeDamaged", (c, e) => c.of(e.target).isActive() && e.value >= 2)
  .usage(2)
  .decreaseDamage(1)
  .on("modifyDamage", (c, e) => e.type === DamageType.Geo && 
    c.$(`my equipment with definition id ${StrategicReserve}`))
  .listenToPlayer()
  .increaseDamage(1)
  .done();

/**
 * @id 16011
 * @name 千金掷
 * @description
 * 造成1点岩元素伤害。
 */
export const SparklingScatter = skill(16011)
  .type("normal")
  .costGeo(1)
  .costVoid(2)
  .damage(DamageType.Geo, 1)
  .done();

/**
 * @id 16012
 * @name 璇玑屏
 * @description
 * 造成2点岩元素伤害，生成璇玑屏。
 */
export const JadeScreen = skill(16012)
  .type("elemental")
  .costGeo(3)
  .damage(DamageType.Geo, 2)
  .combatStatus(JadeScreenStatus)
  .done();

/**
 * @id 16013
 * @name 天权崩玉
 * @description
 * 造成6点岩元素伤害；如果璇玑屏在场，就使此伤害+2。
 */
export const Starshatter = skill(16013)
  .type("burst")
  .costGeo(3)
  .costEnergy(3)
  .if((c) => c.$(`my combat status with definition id ${JadeScreenStatus}`))
  .damage(DamageType.Geo, 8)
  .else()
  .damage(DamageType.Geo, 6)
  .done();

/**
 * @id 1601
 * @name 凝光
 * @description
 * 她保守着一个最大的秘密，那就是自己保守着璃月港的许多秘密。
 */
export const Ningguang = character(1601)
  .tags("geo", "catalyst", "liyue")
  .health(10)
  .energy(3)
  .skills(SparklingScatter, JadeScreen, Starshatter)
  .done();

/**
 * @id 216011
 * @name 储之千日，用之一刻
 * @description
 * 战斗行动：我方出战角色为凝光时，装备此牌。
 * 凝光装备此牌后，立刻使用一次璇玑屏。
 * 装备有此牌的凝光在场时，璇玑屏会使我方造成的岩元素伤害+1。
 * （牌组中包含凝光，才能加入牌组）
 */
export const StrategicReserve = card(216011)
  .costGeo(4)
  .talent(Ningguang)
  .on("enter")
  .useSkill(JadeScreen)
  .done();
