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

import { DiceType, card, combatStatus, status } from "@gi-tcg/core/builder";

/**
 * @id 311201
 * @name 鸦羽弓
 * @description
 * 角色造成的伤害+1。
 * （「弓」角色才能装备。角色最多装备1件「武器」）
 */
export const RavenBow = card(311201)
  .costSame(2)
  .weapon("bow")
  .on("modifySkillDamage")
  .increaseDamage(1)
  .done();

/**
 * @id 311202
 * @name 祭礼弓
 * @description
 * 角色造成的伤害+1。
 * 角色使用「元素战技」后：生成1个此角色类型的元素骰。（每回合1次）
 * （「弓」角色才能装备。角色最多装备1件「武器」）
 */
export const SacrificialBow = card(311202)
  .costSame(3)
  .weapon("bow")
  .on("modifySkillDamage")
  .increaseDamage(1)
  .on("useSkill", (c, e) => e.isSkillType("elemental"))
  .usagePerRound(1)
  .do((c) => {
    c.generateDice(c.self.master().element(), 1);
  })
  .done();

/**
 * @id 311203
 * @name 天空之翼
 * @description
 * 角色造成的伤害+1。
 * 每回合1次：角色使用「普通攻击」造成的伤害额外+1。
 * （「弓」角色才能装备。角色最多装备1件「武器」）
 */
export const SkywardHarp = card(311203)
  .costSame(3)
  .weapon("bow")
  .on("modifySkillDamage")
  .increaseDamage(1)
  .on("modifySkillDamage", (c, e) => e.viaSkillType("normal"))
  .usagePerRound(1)
  .increaseDamage(1)
  .done();

/**
 * @id 311204
 * @name 阿莫斯之弓
 * @description
 * 角色造成的伤害+1。
 * 角色使用原本元素骰费用+充能费用至少为5的技能时，伤害额外+2。（每回合1次）
 * （「弓」角色才能装备。角色最多装备1件「武器」）
 */
export const AmosBow = card(311204)
  .costSame(3)
  .weapon("bow")
  .on("modifySkillDamage")
  .increaseDamage(1)
  .on("modifySkillDamage", (c, e) => e.via.definition.requiredCost.length >= 5)
  .usagePerRound(1)
  .increaseDamage(2)
  .done();

/**
 * @id 301102
 * @name 千年的大乐章·别离之歌
 * @description
 * 我方角色造成的伤害+1。
 * 持续回合：2
 */
const MillennialMovementFarewellSong = combatStatus(301102)
  .duration(2)
  .on("modifySkillDamage")
  .increaseDamage(1)
  .done();

/**
 * @id 311205
 * @name 终末嗟叹之诗
 * @description
 * 角色造成的伤害+1。
 * 角色使用「元素爆发」后：生成「千年的大乐章·别离之歌」。（我方角色造成的伤害+1，持续回合：2）
 * （「弓」角色才能装备。角色最多装备1件「武器」）
 */
export const ElegyForTheEnd = card(311205)
  .costSame(3)
  .weapon("bow")
  .on("modifySkillDamage")
  .increaseDamage(1)
  .on("useSkill", (c, e) => e.isSkillType("burst"))
  .combatStatus(MillennialMovementFarewellSong)
  .done();

/**
 * @id 301103
 * @name 王下近侍（生效中）
 * @description
 * 角色在本回合中，下次使用「元素战技」或装备「天赋」时：少花费2个元素骰。
 */
export const KingsSquireStatus = status(301103)
  .oneDuration()
  .once("deductDice", (c, e) => e.isSkillOrTalentOf(c.self.master().state))
  .deductCost(DiceType.Omni, 2)
  .done();

/**
 * @id 311206
 * @name 王下近侍
 * @description
 * 角色造成的伤害+1。
 * 入场时：所附属角色在本回合中，下次使用「元素战技」或装备「天赋」时少花费2个元素骰。
 * （「弓」角色才能装备。角色最多装备1件「武器」）
 */
export const KingsSquire = card(311206)
  .costSame(3)
  .weapon("bow")
  .on("modifySkillDamage")
  .increaseDamage(1)
  .on("enter")
  .characterStatus(KingsSquireStatus, "@master")
  .done();
