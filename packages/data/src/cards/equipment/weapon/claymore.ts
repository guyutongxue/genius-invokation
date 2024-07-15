// Copyright (C) 2024 Guyutongxue
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { card, combatStatus, status } from "@gi-tcg/core/builder";

/**
 * @id 311301
 * @name 白铁大剑
 * @description
 * 角色造成的伤害+1。
 * （「双手剑」角色才能装备。角色最多装备1件「武器」）
 */
export const WhiteIronGreatsword = card(311301)
  .since("v3.3.0")
  .costSame(2)
  .weapon("claymore")
  .on("modifySkillDamage")
  .increaseDamage(1)
  .done();

/**
 * @id 311302
 * @name 祭礼大剑
 * @description
 * 角色造成的伤害+1。
 * 角色使用「元素战技」后：生成1个此角色类型的元素骰。（每回合1次）
 * （「双手剑」角色才能装备。角色最多装备1件「武器」）
 */
export const SacrificialGreatsword = card(311302)
  .since("v3.3.0")
  .costSame(3)
  .weapon("claymore")
  .on("modifySkillDamage")
  .increaseDamage(1)
  .on("useSkill", (c, e) => e.isSkillType("elemental"))
  .usagePerRound(1)
  .do((c) => {
    c.generateDice(c.self.master().element(), 1);
  })
  .done();

/**
 * @id 311303
 * @name 狼的末路
 * @description
 * 角色造成的伤害+1。
 * 攻击剩余生命值不多于6的目标时，伤害额外+2。
 * （「双手剑」角色才能装备。角色最多装备1件「武器」）
 */
export const WolfsGravestone = card(311303)
  .since("v3.3.0")
  .costSame(3)
  .weapon("claymore")
  .on("modifySkillDamage")
  .do((c, e) => {
    if (c.of(e.target).health <= 6) {
      e.increaseDamage(3);
    } else {
      e.increaseDamage(1);
    }
  })
  .done();

/**
 * @id 311304
 * @name 天空之傲
 * @description
 * 角色造成的伤害+1。
 * 每回合1次：角色使用「普通攻击」造成的伤害额外+1。
 * （「双手剑」角色才能装备。角色最多装备1件「武器」）
 */
export const SkywardPride = card(311304)
  .since("v3.7.0")
  .costSame(3)
  .weapon("claymore")
  .on("modifySkillDamage")
  .increaseDamage(1)
  .on("modifySkillDamage", (c, e) => e.viaSkillType("normal"))
  .usagePerRound(1)
  .increaseDamage(1)
  .done();

/**
 * @id 121013
 * @name 叛逆的守护
 * @description
 * 提供1点护盾，保护我方出战角色。（可叠加，最多叠加到2点）
 */
const RebelliousShield = combatStatus(121013)
  .shield(1, 2)
  .done();

/**
 * @id 311305
 * @name 钟剑
 * @description
 * 角色造成的伤害+1。
 * 角色使用技能后：为我方出战角色提供1点护盾。（每回合1次，可叠加到2点）
 * （「双手剑」角色才能装备。角色最多装备1件「武器」）
 */
export const TheBell = card(311305)
  .since("v3.7.0")
  .costSame(3)
  .weapon("claymore")
  .on("modifySkillDamage")
  .increaseDamage(1)
  .on("useSkill")
  .combatStatus(RebelliousShield)
  .done();

/**
 * @id 301105
 * @name 沙海守望·主动出击
 * @description
 * 本回合内，所附属角色下次造成的伤害额外+1。
 */
const DesertWatchTakeTheInitiative = status(301105)
  .oneDuration()
  .once("modifySkillDamage")
  .increaseDamage(1)
  .done();

/**
 * @id 301106
 * @name 沙海守望·攻势防御
 * @description
 * 本回合内，所附属角色下次造成的伤害额外+1。
 */
const DesertWatchOffensiveDefense = status(301106)
  .oneDuration()
  .once("modifySkillDamage")
  .increaseDamage(1)
  .done();

/**
 * @id 311306
 * @name 苇海信标
 * @description
 * 角色造成的伤害+1。
 * 角色使用「元素战技」后：本回合内，角色下次造成的伤害额外+1。（每回合1次）
 * 角色受到伤害后：本回合内，角色下次造成的伤害额外+1。（每回合1次）
 * （「双手剑」角色才能装备。角色最多装备1件「武器」）
 */
export const BeaconOfTheReedSea = card(311306)
  .since("v4.3.0")
  .costSame(3)
  .weapon("claymore")
  .on("modifySkillDamage")
  .increaseDamage(1)
  .on("useSkill")
  .characterStatus(DesertWatchTakeTheInitiative, "@master")
  .on("damaged")
  .characterStatus(DesertWatchOffensiveDefense, "@master")
  .done();

/**
 * @id 301109
 * @name 森林王器（生效中）
 * @description
 * 角色在本回合中，下次使用「普通攻击」后：生成2个此角色类型的元素骰。
 */
export const ForestRegaliaInEffect = status(301109)
  .oneDuration()
  .once("useSkill", (c, e) => e.isSkillType("normal"))
  .do((c) => {
    c.generateDice(c.self.master().element(), 2);
  })
  .done();

/**
 * @id 311307
 * @name 森林王器
 * @description
 * 角色造成的伤害+1。
 * 入场时：所附属角色在本回合中，下次使用「普通攻击」后：生成2个此角色类型的元素骰。
 * （「双手剑」角色才能装备。角色最多装备1件「武器」）
 */
export const ForestRegalia = card(311307)
  .since("v4.7.0")
  .costVoid(3)
  .weapon("claymore")
  .on("modifySkillDamage")
  .increaseDamage(1)
  .on("enter")
  .characterStatus(ForestRegaliaInEffect, "@master")
  .done();

/**
 * @id 311308
 * @name 「究极霸王超级魔剑」
 * @description
 * 此牌会记录本局游戏中你打出过的名称不存在于本局最初牌组中的不同名的行动牌数量，称为「声援」。
 * 如果此牌的「声援」至少为2/4/8，则角色造成的伤害+1/2/3。
 * （「双手剑」角色才能装备。角色最多装备1件「武器」）
 */
export const UltimateOverlordsMegaMagicSword = card(311308)
  .costSame(2)
  .weapon("claymore")
  .since("v4.8.0")
  // TODO
  .done();
