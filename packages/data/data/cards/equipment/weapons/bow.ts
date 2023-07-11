import { createCard, createStatus } from '@gi-tcg';

/**
 * **阿莫斯之弓**
 * 角色造成的伤害+1。
 * 角色使用原本元素骰费用+充能费用至少为5的技能时，伤害额外+2。（每回合1次）
 * （「弓」角色才能装备。角色最多装备1件「武器」）
 */
const AmosBow = createCard(311204, ["character"])
  .setType("equipment")
  .addTags("weaponBow")
  .costSame(3)
  .buildToEquipment()
  .on("beforeSkillDamage", (c) => {
    c.addDamage(1);
    if ("costs" in c.skillInfo && c.skillInfo.costs.length >= 5) {
      c.addDamage(2);
    }
  })
  .build();

/**
 * **千年的大乐章·别离之歌**
 * 我方角色造成的伤害+1。
 * 持续回合：2
 */
const MillennialMovementFarewellSong = createStatus(301102)
  .withDuration(2)
  .on("beforeDealDamage", (c) => c.addDamage(2))
  .build();

/**
 * **终末嗟叹之诗**
 * 角色造成的伤害+1。
 * 角色使用「元素爆发」后：生成「千年的大乐章·别离之歌」。（我方角色造成的伤害+1，持续回合：2）
 * （「弓」角色才能装备。角色最多装备1件「武器」）
 */
const ElegyForTheEnd = createCard(311205, ["character"])
  .setType("equipment")
  .addTags("weaponBow")
  .costSame(3)
  .buildToEquipment()
  .on("beforeSkillDamage", (c) => c.addDamage(1))
  .on("useSkill", (c) => {
    if (c.info.type === "burst") {
      c.createCombatStatus(MillennialMovementFarewellSong);
    }
  })
  .build();

/**
 * **鸦羽弓**
 * 角色造成的伤害+1。
 * （「弓」角色才能装备。角色最多装备1件「武器」）
 */
const RavenBow = createCard(311201, ["character"])
  .setType("equipment")
  .addTags("weaponBow")
  .costSame(2)
  .buildToEquipment()
  .on("beforeSkillDamage", (c) => c.addDamage(1))
  .build();

/**
 * **祭礼弓**
 * 角色造成的伤害+1。
 * 角色使用「元素战技」后：生成1个此角色类型的元素骰。（每回合1次）
 * （「弓」角色才能装备。角色最多装备1件「武器」）
 */
const SacrificialBow = createCard(311202, ["character"])
  .setType("equipment")
  .addTags("weaponBow")
  .costSame(3)
  .buildToEquipment()
  .withUsagePerRound(1)
  .on("beforeSkillDamage", (c) => (c.addDamage(1), false))
  .on("useSkill", (c) => {
    if (c.info.type === "elemental") {
      c.generateDice(c.character.elementType());
    } else {
      return false;
    }
  })
  .build();

/**
 * **天空之翼**
 * 角色造成的伤害+1。
 * 每回合1次：角色使用「普通攻击」造成的伤害额外+1。
 * （「弓」角色才能装备。角色最多装备1件「武器」）
 */
const SkywardHarp = createCard(311203, ["character"])
  .setType("equipment")
  .addTags("weaponBow")
  .costSame(3)
  .buildToEquipment()
  .on("beforeSkillDamage", (c) => {
    if (c.skillInfo.type === "normal") {
      c.addDamage(2);
    } else {
      c.addDamage(1);
    }
  })
  .build();
