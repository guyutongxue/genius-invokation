import { createCard, createStatus } from '@gi-tcg';

/**
 * **祭礼大剑**
 * 角色造成的伤害+1。
 * 角色使用「元素战技」后：生成1个此角色类型的元素骰。（每回合1次）
 * （「双手剑」角色才能装备。角色最多装备1件「武器」）
 */
const SacrificialGreatsword = createCard(311302, ["character"])
  .setType("equipment")
  .addTags("weaponClaymore")
  .costSame(3)
  .buildToEquipment()
  .withUsagePerRound(1)
  .on("beforeSkillDamage", (c) => (c.addDamage(1), false))
  .on("useSkill", 
    (c) => c.info.type === "elemental", 
    (c) => c.generateDice(c.character.elementType()))
  .build();

/**
 * **天空之傲**
 * 角色造成的伤害+1。
 * 每回合1次：角色使用「普通攻击」造成的伤害额外+1。
 * （「双手剑」角色才能装备。角色最多装备1件「武器」）
 */
const SkywardPride = createCard(311304, ["character"])
  .setType("equipment")
  .addTags("weaponClaymore")
  .costSame(3)
  .buildToEquipment()
  .on("beforeSkillDamage", (c) => {
    if (c.sourceSkill.info.type === "normal") {
      c.addDamage(2);
    } else {
      c.addDamage(1);
    }
  })
  .build();

/**
 * **叛逆的守护**
 * 提供1点护盾，保护我方出战角色。（可叠加，最多叠加到2点）
 */
const RebelliousShield = createStatus(121013)
  .shield({ initial: 1, recreateMax: 2 })
  .build();

/**
 * **钟剑**
 * 角色造成的伤害+1。
 * 角色使用技能后：为我方出战角色提供1点护盾。（每回合1次，可叠加到2点）
 * （「双手剑」角色才能装备。角色最多装备1件「武器」）
 */
const TheBell = createCard(311305, ["character"])
  .setType("equipment")
  .addTags("weaponClaymore")
  .costSame(3)
  .buildToEquipment()
  .withUsagePerRound(1)
  .on("beforeSkillDamage", (c) => (c.addDamage(1), false))
  .on("useSkill", (c) => (c.queryCharacter("|")?.createStatus(RebelliousShield), true))
  .build();

/**
 * **白铁大剑**
 * 角色造成的伤害+1。
 * （「双手剑」角色才能装备。角色最多装备1件「武器」）
 */
const WhiteIronGreatsword = createCard(311301, ["character"])
  .setType("equipment")
  .addTags("weaponClaymore")
  .costSame(2)
  .buildToEquipment()
  .on("beforeSkillDamage", (c) => c.addDamage(1))
  .build();

/**
 * **狼的末路**
 * 角色造成的伤害+1。
 * 攻击剩余生命值不多于6的目标时，伤害额外+2。
 * （「双手剑」角色才能装备。角色最多装备1件「武器」）
 */
const WolfsGravestone = createCard(311303, ["character"])
  .setType("equipment")
  .addTags("weaponClaymore")
  .costSame(3)
  .buildToEquipment()
  .on("beforeSkillDamage", (c) => {
    if (c.target.health <= 6) {
      c.addDamage(3);
    } else {
      c.addDamage(1);
    }
  })
  .build();
