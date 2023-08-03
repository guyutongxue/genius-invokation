import { createCard, createCharacter, createSkill, createStatus, DamageType } from "@gi-tcg";

/**
 * **Plama Lawa**
 * 造成2点物理伤害。
 */
const PlamaLawa = createSkill(26011)
  .setType("normal")
  .costGeo(1)
  .costVoid(2)
  .dealDamage(2, DamageType.Physical)
  .build();

/**
 * **Movo Lawa**
 * 造成3点物理伤害。
 */
const MovoLawa = createSkill(26012)
  .setType("elemental")
  .costGeo(3)
  .dealDamage(3, DamageType.Physical)
  .build();

/**
 * **Upa Shato**
 * 造成5点物理伤害。
 */
const UpaShato = createSkill(26013)
  .setType("burst")
  .costGeo(3)
  .costEnergy(2)
  .dealDamage(5, DamageType.Physical)
  .build();

/**
 * **岩盔**
 * 所附属角色受到伤害时：抵消1点伤害。抵消岩元素伤害时，需额外消耗1次可用次数。
 * 可用次数：3
 */
const Stonehide = createStatus(126011)
  .withUsage(3)
  .on("beforeDamaged", (c) => {
    if (c.damageType === DamageType.Geo) {
      c.this.setUsage(c.this.usage - 1);
    }
    c.decreaseDamage(1);
  })
  .on("dispose", (c) => {
    c.this.master?.findStatus(StoneForce)?.dispose();
  })
  .build();

/**
 * **坚岩之力**
 * 角色造成的物理伤害变为岩元素伤害。
 * 每回合1次：角色造成的伤害+1。
 * 角色所附属的「岩盔」被移除后：也移除此状态。
 */
const StoneForce = createStatus(126012)
  .withThis({ addDamage: true })
  .on("earlyBeforeDealDamage", (c) => {
    if (c.damageType === DamageType.Physical) {
      c.changeDamageType(DamageType.Geo);
    }
  })
  .on("beforeDealDamage",
    (c) => c.this.addDamage,
    (c) => {
      c.addDamage(1);
      c.this.addDamage = false;
    })
  .on("actionPhase", (c) => { c.this.addDamage = true; })
  .build();

/**
 * **魔化：岩盔**
 * 【被动】战斗开始时，初始附属岩盔和坚岩之力。
 */
const InfusedStonehide = createSkill(26014)
  .setType("passive")
  // TODO
  .build();

export const StonehideLawachurl = createCharacter(2601)
  .addTags("geo", "monster", "hilichurl")
  .maxHealth(8)
  .maxEnergy(2)
  .addSkills(PlamaLawa, MovoLawa, UpaShato, InfusedStonehide)
  .build();

/**
 * **重铸：岩盔**
 * 战斗行动：我方出战角色为丘丘岩盔王时，装备此牌。
 * 丘丘岩盔王装备此牌后，立刻使用一次Upa Shato。
 * 装备有此牌的丘丘岩盔王击倒敌方角色后；丘丘岩盔王重新附属岩盔和坚岩之力。
 * （牌组中包含丘丘岩盔王，才能加入牌组）
 */
export const StonehideReforged = createCard(226011, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .costGeo(4)
  .costEnergy(2)
  // TODO
  .build();
