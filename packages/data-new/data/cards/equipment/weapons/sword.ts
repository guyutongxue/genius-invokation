import { createCard } from '@gi-tcg';

/**
 * **风鹰剑**
 * 角色造成的伤害+1。
 * 对方使用技能后：如果所附属角色为「出战角色」，则治疗该角色1点。（每回合至多2次）
 * （「单手剑」角色才能装备。角色最多装备1件「武器」）
 */
const AquilaFavonia = createCard(311503, ["character"])
  .setType("equipment")
  .addTags("weaponSword")
  .costSame(3)
  .buildToEquipment()
  .listenToOpp()
  .withUsagePerRound(2)
  .on("beforeUseSkill", (c) => (c.damage?.addDamage(1), false))
  .on("useSkill", (c) => {
    if (!c.character.isMine() && c.getMaster().isActive()) {
      c.getMaster().heal(1);
    } else {
      return false;
    }
  })
  .build();

/**
 * **西风剑**
 * 角色造成的伤害+1。
 * 角色使用「元素战技」后：角色额外获得1点充能。（每回合1次）
 * （「单手剑」角色才能装备。角色最多装备1件「武器」）
 */
const FavoniusSword = createCard(311505, ["character"])
  .setType("equipment")
  .addTags("weaponSword")
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
 * **祭礼剑**
 * 角色造成的伤害+1。
 * 角色使用「元素战技」后：生成1个此角色类型的元素骰。（每回合1次）
 * （「单手剑」角色才能装备。角色最多装备1件「武器」）
 */
const SacrificialSword = createCard(311502, ["character"])
  .setType("equipment")
  .addTags("weaponSword")
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
 * **天空之刃**
 * 角色造成的伤害+1。
 * 每回合1次：角色使用「普通攻击」造成的伤害额外+1。
 * （「单手剑」角色才能装备。角色最多装备1件「武器」）
 */
const SkywardBlade = createCard(311504, ["character"])
  .setType("equipment")
  .addTags("weaponSword")
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
 * **旅行剑**
 * 角色造成的伤害+1。
 * （「单手剑」角色才能装备。角色最多装备1件「武器」）
 */
const TravelersHandySword = createCard(311501, ["character"])
  .setType("equipment")
  .addTags("weaponSword")
  .costSame(2)
  .buildToEquipment()
  .on("beforeUseSkill", (c) => c.damage?.addDamage(1))
  .build();
