import { character, skill, summon, status, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 123021
 * @name 黯火炉心
 * @description
 * 结束阶段：造成1点火元素伤害，对所有敌方后台角色造成1点穿透伤害。
 * 可用次数：2
 */
export const DarkfireFurnace = summon(123021)
  .hintIcon(DamageType.Pyro)
  .hintText("1")
  .on("endPhase")
  .usage(2)
  .damage(DamageType.Piercing, 1, "opp standby")
  .damage(DamageType.Pyro, 1)
  .done();

/**
 * @id 123024
 * @name 渊火加护
 * @description
 * 为所附属角色提供3点护盾。
 * 此护盾耗尽前：所附属角色造成的火元素伤害+1。
 */
export const AegisOfAbyssalFlame = status(123024)
  .shield(3)
  .on("modifyDamage", (c, e) => e.type === DamageType.Pyro)
  .increaseDamage(1)
  .done();

/**
 * @id 123022
 * @name 火之新生
 * @description
 * 所附属角色被击倒时：移除此效果，使角色免于被击倒，并治疗该角色到3点生命值。
 */
export const FieryRebirthStatus = status(123022)
  .on("beforeDefeated")
  .immune(3)
  .do((c) => {
    const talent = c.self.master().hasEquipment(EmbersRekindled);
    if (talent) {
      c.dispose(talent);
      c.characterStatus(AegisOfAbyssalFlame, "@master");
    }
  })
  .dispose()
  .done();

/**
 * @id 123025
 * @name 将熄的余烬
 * @description
 * 所附属角色无法使用技能。
 * 结束阶段：对所附属角色造成6点穿透伤害，然后移除此效果。
 */
export const QuenchedEmbers = status(123025)
  .reserve();

/**
 * @id 123023
 * @name 涌火护罩
 * @description
 * 所附属角色免疫所有伤害。
 * 此状态提供2次火元素附着（可被元素反应消耗）：耗尽后移除此效果，并使所附属角色无法使用技能且在结束阶段受到6点穿透伤害。
 * 此效果存在期间：角色造成的火元素伤害+1。
 */
export const ShieldOfSurgingFlame = status(123023)
  .reserve();

/**
 * @id 23021
 * @name 拯救之焰
 * @description
 * 造成1点火元素伤害。
 */
export const FlameOfSalvation = skill(23021)
  .type("normal")
  .costPyro(1)
  .costVoid(2)
  .damage(DamageType.Pyro, 1)
  .done();

/**
 * @id 23022
 * @name 炽烈箴言
 * @description
 * 造成3点火元素伤害。
 */
export const SearingPrecept = skill(23022)
  .type("elemental")
  .costPyro(3)
  .damage(DamageType.Pyro, 3)
  .done();

/**
 * @id 23023
 * @name 天陨预兆
 * @description
 * 造成3点火元素伤害，召唤黯火炉心。
 */
export const OminousStar = skill(23023)
  .type("burst")
  .costPyro(4)
  .costEnergy(2)
  .damage(DamageType.Pyro, 3)
  .summon(DarkfireFurnace)
  .done();

/**
 * @id 23024
 * @name 火之新生
 * @description
 * 【被动】战斗开始时，初始附属火之新生。
 */
export const FieryRebirth = skill(23024)
  .type("passive")
  .on("battleBegin")
  .characterStatus(FieryRebirthStatus)
  .done();

/**
 * @id 2302
 * @name 深渊咏者·渊火
 * @description
 * 章典示现，劝听箴言。
 */
export const AbyssLectorFathomlessFlames = character(2302)
  .tags("pyro", "monster")
  .health(6)
  .energy(2)
  .skills(FlameOfSalvation, SearingPrecept, OminousStar, FieryRebirth)
  .done();

/**
 * @id 223021
 * @name 烬火重燃
 * @description
 * 入场时：如果装备有此牌的深渊咏者·渊火已触发过火之新生，就立刻弃置此牌，为角色附属渊火加护。
 * 装备有此牌的深渊咏者·渊火触发火之新生时：弃置此牌，为角色附属渊火加护。
 * （牌组中包含深渊咏者·渊火，才能加入牌组）
 */
export const EmbersRekindled = card(223021)
  .costPyro(2)
  .talent(AbyssLectorFathomlessFlames, "none")
  .on("enter")
  .do((c) => {
    if (!c.self.master().hasStatus(FieryRebirthStatus)) {
      c.characterStatus(AegisOfAbyssalFlame, "@master");
      c.dispose();
    }
  })
  .done();
