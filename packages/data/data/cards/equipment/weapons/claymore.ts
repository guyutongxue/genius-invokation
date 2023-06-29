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
  .on("beforeUseSkill", (c) => (c.damage?.addDamage(1), false))
  .on("useSkill", (c) => {
    if (c.info.type === "elemental") {
      c.generateDice(c.character.elementType());
    } else {
      return false;
    }
  })
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
  .on("beforeUseSkill", (c) => {
    if (c.damage) {
      if (c.info.type === "normal") {
        c.damage.addDamage(2);
      } else {
        c.damage.addDamage(1);
      }
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
  .on("beforeUseSkill", (c) => (c.damage?.addDamage(1), false))
  .on("useSkill", (c) => (c.createStatus(RebelliousShield), true))
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
  .on("beforeUseSkill", (c) => c.damage?.addDamage(1))
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
  .on("beforeUseSkill", (c) => {
    if (c.damage) {
      if (c.damage.target.health <= 6) {
        c.damage.addDamage(3);
      } else {
        c.damage.addDamage(1);
      }
    }
  })
  .build();
