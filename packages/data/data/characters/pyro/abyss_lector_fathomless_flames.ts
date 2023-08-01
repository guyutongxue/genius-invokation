import { createCard, createCharacter, createEquipment, createSkill, createStatus, createSummon, DamageType } from "@gi-tcg";

/**
 * **拯救之焰**
 * 造成1点火元素伤害。
 */
const FlameOfSalvation = createSkill(23021)
  .setType("normal")
  .costPyro(1)
  .costVoid(2)
  .dealDamage(1, DamageType.Pyro)
  .build();

/**
 * **炽烈箴言**
 * 造成3点火元素伤害。
 */
const SearingPrecept = createSkill(23022)
  .setType("elemental")
  .costPyro(3)
  .dealDamage(3, DamageType.Pyro)
  .build();

/**
 * **黯火炉心**
 * 结束阶段：造成1点火元素伤害，对所有敌方后台角色造成1点穿透伤害。
 * 可用次数：2
 */
const DarkfireFurnace = createSummon(123021)
  .withUsage(2)
  .on("endPhase", (c) => {
    c.dealDamage(1, DamageType.Pyro);
    c.dealDamage(1, DamageType.Piercing, "!<>");
  })
  .build();

/**
 * **天陨预兆**
 * 造成3点火元素伤害，召唤黯火炉心。
 */
const OminousStar = createSkill(23023)
  .setType("burst")
  .costPyro(4)
  .costEnergy(2)
  .dealDamage(3, DamageType.Pyro)
  .summon(DarkfireFurnace)
  .build();

/**
 * **火之新生**
 * 所附属角色被击倒时：移除此效果，使角色免于被击倒，并治疗该角色到3点生命值。
 */
const FieryRebirthStaus = createStatus(123022)
  .withUsage(1)
  .on("beforeDefeated", (c) => c.immune(3))
  .build();

/**
 * **火之新生**
 * 【被动】战斗开始时，初始附属火之新生。
 */
const FieryRebirth = createSkill(23024)
  .setType("passive")
  .on("battleBegin", (c) => { c.this.master.createStatus(FieryRebirthStaus); })
  .build();

export const AbyssLectorFathomlessFlames = createCharacter(2302)
  .addTags("pyro", "monster")
  .maxHealth(6)
  .maxEnergy(2)
  .addSkills(FlameOfSalvation, SearingPrecept, OminousStar, FieryRebirth)
  .build();

/**
 * **渊火加护**
 * 为所附属角色提供3点护盾。
 * 此护盾耗尽前：所附属角色造成的火元素伤害+1。
 */
const AegisOfAbyssalFlame = createStatus(123024)
  .shield(3)
  .on("beforeDealDamage", (c) => {
    if (c.damageType === DamageType.Pyro) {
      c.addDamage(1);
    }
  })
  .build();

/**
 * **烬火重燃**
 * 入场时：如果装备有此牌的深渊咏者·渊火已触发过火之新生，就立刻弃置此牌，为角色附属渊火加护。
 * 装备有此牌的深渊咏者·渊火触发火之新生时：弃置此牌，为角色附属渊火加护。
 * （牌组中包含深渊咏者·渊火，才能加入牌组）
 */
export const EmbersRekindled = createCard(223021, ["character"])
  .setType("equipment")
  .addTags("talent")
  .requireCharacter(AbyssLectorFathomlessFlames)
  .addCharacterFilter(AbyssLectorFathomlessFlames, { needActive: false })
  .costPyro(2)
  .do((c) => {
    const ch = c.queryCharacter(`@${AbyssLectorFathomlessFlames}`);
    if (!ch) return;
    if (!ch.findStatus(FieryRebirthStaus)) {
      ch.createStatus(AegisOfAbyssalFlame);
    } else {
      ch.equip(EmbersRekindledEquip);
    }
  })
  .build();

const EmbersRekindledEquip = createEquipment(EmbersRekindled)
  .on("beforeDefeated", (c) => {
    c.this.master.createStatus(AegisOfAbyssalFlame);
    c.this.dispose();
  })
  .build();
