import { createCard } from '@gi-tcg';

/**
 * **千夜浮梦**
 * 角色造成的伤害+1。
 * 我方角色引发元素反应时：造成的伤害+1。（每回合最多触发2次）
 * （「法器」角色才能装备。角色最多装备1件「武器」）
 */
const AThousandFloatingDreams = createCard(311104, ["character"])
  .setType("equipment")
  .addTags("weaponCatalyst")
  .costSame(3)
  .buildToEquipment()
  .withUsagePerRound(2)
  .on("beforeUseSkill", (c) => (c.damage?.addDamage(1), false))
  .on("beforeDealDamage", (c) => {
    if (c.reaction) {
      c.addDamage(1);
    } else {
      return false;
    }
  })
  .build();

/**
 * **魔导绪论**
 * 角色造成的伤害+1。
 * （「法器」角色才能装备。角色最多装备1件「武器」）
 */
const MagicGuide = createCard(311101, ["character"])
  .setType("equipment")
  .addTags("weaponCatalyst")
  .costSame(2)
  .buildToEquipment()
  .on("beforeUseSkill", c => c.damage?.addDamage(1))
  .build();

/**
 * **祭礼残章**
 * 角色造成的伤害+1。
 * 角色使用「元素战技」后：生成1个此角色类型的元素骰。（每回合1次）
 * （「法器」角色才能装备。角色最多装备1件「武器」）
 */
const SacrificialFragments = createCard(311102, ["character"])
  .setType("equipment")
  .addTags("weaponCatalyst")
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
 * **天空之卷**
 * 角色造成的伤害+1。
 * 每回合1次：角色使用「普通攻击」造成的伤害额外+1。
 * （「法器」角色才能装备。角色最多装备1件「武器」）
 */
const SkywardAtlas = createCard(311103, ["character"])
  .setType("equipment")
  .addTags("weaponCatalyst")
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
