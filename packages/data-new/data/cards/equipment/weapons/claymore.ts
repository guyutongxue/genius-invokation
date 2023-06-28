import { createCard } from '@gi-tcg';

/**
 * **祭礼大剑**
 * 角色造成的伤害+1。
 * 角色使用「元素战技」后：生成1个此角色类型的元素骰。（每回合1次）
 * （「双手剑」角色才能装备。角色最多装备1件「武器」）
 */
export const SacrificialGreatsword = createCard(311302)
  .setType("equipment")
  .addTags("weaponClaymore")
  .costSame(3)
  // TODO
  .build();

/**
 * **天空之傲**
 * 角色造成的伤害+1。
 * 每回合1次：角色使用「普通攻击」造成的伤害额外+1。
 * （「双手剑」角色才能装备。角色最多装备1件「武器」）
 */
export const SkywardPride = createCard(311304)
  .setType("equipment")
  .addTags("weaponClaymore")
  .costSame(3)
  // TODO
  .build();

/**
 * **钟剑**
 * 角色造成的伤害+1。
 * 角色使用技能后：为我方出战角色提供1点护盾。（每回合1次，可叠加到2点）
 * （「双手剑」角色才能装备。角色最多装备1件「武器」）
 */
export const TheBell = createCard(311305)
  .setType("equipment")
  .addTags("weaponClaymore")
  .costSame(3)
  // TODO
  .build();

/**
 * **白铁大剑**
 * 角色造成的伤害+1。
 * （「双手剑」角色才能装备。角色最多装备1件「武器」）
 */
export const WhiteIronGreatsword = createCard(311301)
  .setType("equipment")
  .addTags("weaponClaymore")
  .costSame(2)
  // TODO
  .build();

/**
 * **狼的末路**
 * 角色造成的伤害+1。
 * 攻击剩余生命值不多于6的目标时，伤害额外+2。
 * （「双手剑」角色才能装备。角色最多装备1件「武器」）
 */
export const WolfsGravestone = createCard(311303)
  .setType("equipment")
  .addTags("weaponClaymore")
  .costSame(3)
  // TODO
  .build();
