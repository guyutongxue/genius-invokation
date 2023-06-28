import { createCard } from '@gi-tcg';

/**
 * **阿莫斯之弓**
 * 角色造成的伤害+1。
 * 角色使用原本元素骰费用+充能费用至少为5的技能时，伤害额外+2。（每回合1次）
 * （「弓」角色才能装备。角色最多装备1件「武器」）
 */
export const AmosBow = createCard(311204)
  .setType("equipment")
  .addTags("weaponBow")
  .costSame(3)
  .buildToEquipment()
  .build();

/**
 * **终末嗟叹之诗**
 * 角色造成的伤害+1。
 * 角色使用「元素爆发」后：生成「千年的大乐章·别离之歌」。（我方角色造成的伤害+1，持续回合：2）
 * （「弓」角色才能装备。角色最多装备1件「武器」）
 */
export const ElegyForTheEnd = createCard(311205)
  .setType("equipment")
  .addTags("weaponBow")
  .costSame(3)
  // TODO
  .build();

/**
 * **鸦羽弓**
 * 角色造成的伤害+1。
 * （「弓」角色才能装备。角色最多装备1件「武器」）
 */
export const RavenBow = createCard(311201)
  .setType("equipment")
  .addTags("weaponBow")
  .costSame(2)
  // TODO
  .build();

/**
 * **祭礼弓**
 * 角色造成的伤害+1。
 * 角色使用「元素战技」后：生成1个此角色类型的元素骰。（每回合1次）
 * （「弓」角色才能装备。角色最多装备1件「武器」）
 */
export const SacrificialBow = createCard(311202)
  .setType("equipment")
  .addTags("weaponBow")
  .costSame(3)
  // TODO
  .build();

/**
 * **天空之翼**
 * 角色造成的伤害+1。
 * 每回合1次：角色使用「普通攻击」造成的伤害额外+1。
 * （「弓」角色才能装备。角色最多装备1件「武器」）
 */
export const SkywardHarp = createCard(311203)
  .setType("equipment")
  .addTags("weaponBow")
  .costSame(3)
  // TODO
  .build();
