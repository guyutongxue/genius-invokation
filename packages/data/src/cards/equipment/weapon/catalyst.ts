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

import { DiceType, card, status } from "@gi-tcg/core/builder";

/**
 * @id 311101
 * @name 魔导绪论
 * @description
 * 角色造成的伤害+1。
 * （「法器」角色才能装备。角色最多装备1件「武器」）
 */
export const MagicGuide = card(311101)
  .costSame(2)
  .weapon("catalyst")
  .on("modifySkillDamage")
  .increaseDamage(1)
  .done();

/**
 * @id 311102
 * @name 祭礼残章
 * @description
 * 角色造成的伤害+1。
 * 角色使用「元素战技」后：生成1个此角色类型的元素骰。（每回合1次）
 * （「法器」角色才能装备。角色最多装备1件「武器」）
 */
export const SacrificialFragments = card(311102)
  .costSame(3)
  .weapon("catalyst")
  .on("modifySkillDamage")
  .increaseDamage(1)
  .on("useSkill", (c, e) => e.isSkillType("elemental"))
  .usagePerRound(1)
  .do((c) => {
    c.generateDice(c.self.master().element(), 1);
  })
  .done();

/**
 * @id 311103
 * @name 天空之卷
 * @description
 * 角色造成的伤害+1。
 * 每回合1次：角色使用「普通攻击」造成的伤害额外+1。
 * （「法器」角色才能装备。角色最多装备1件「武器」）
 */
export const SkywardAtlas = card(311103)
  .costSame(3)
  .weapon("catalyst")
  .on("modifySkillDamage")
  .increaseDamage(1)
  .on("modifySkillDamage", (c, e) => e.viaSkillType("normal"))
  .usagePerRound(1)
  .increaseDamage(1)
  .done();

/**
 * @id 311104
 * @name 千夜浮梦
 * @description
 * 角色造成的伤害+1。
 * 我方角色引发元素反应时：造成的伤害+1。（每回合最多触发2次）
 * （「法器」角色才能装备。角色最多装备1件「武器」）
 */
export const AThousandFloatingDreams = card(311104)
  .costSame(3)
  .weapon("catalyst")
  .on("modifySkillDamage")
  .increaseDamage(1)
  .on("modifySkillDamage", (c, e) => e.getReaction())
  .listenToPlayer()
  .usagePerRound(2)
  .increaseDamage(1)
  .done();

/**
 * @id 311105
 * @name 盈满之实
 * @description
 * 角色造成的伤害+1。
 * 入场时：抓2张牌。
 * （「法器」角色才能装备。角色最多装备1件「武器」）
 */
export const FruitOfFulfillment = card(311105)
  .costVoid(3)
  .weapon("catalyst")
  .on("modifySkillDamage")
  .increaseDamage(1)
  .on("enter")
  .drawCards(2)
  .done();

/**
 * @id 311106
 * @name 四风原典
 * @description
 * 此牌每有1点「伤害加成」，角色造成的伤害+1。
 * 结束阶段：此牌累积1点「伤害加成」。（最多累积到2点）
 * （「法器」角色才能装备。角色最多装备1件「武器」）
 */
export const LostPrayerToTheSacredWinds = card(311106)
  .costSame(3)
  .weapon("catalyst")
  .variable("extraDamage", 0)
  .on("modifySkillDamage")
  .do((c, e) => {
    e.increaseDamage(c.getVariable("extraDamage"));
  })
  .on("endPhase")
  .addVariableWithMax("extraDamage", 1, 2)
  .done();

/**
 * @id 311107
 * @name 图莱杜拉的回忆
 * @description
 * 角色造成的伤害+1。
 * 角色进行重击时：少花费1个无色元素。（每回合最多触发2次）
 * （「法器」角色才能装备。角色最多装备1件「武器」）
 */
export const TulaytullahsRemembrance = card(311107)
  .costSame(3)
  .weapon("catalyst")
  .on("modifySkillDamage")
  .increaseDamage(1)
  .on("deductDiceSkill", (c, e) => e.isChargedAttack() && e.canDeductCostOfType(DiceType.Void))
  .usagePerRound(2)
  .deductCost(DiceType.Void, 1)
  .done();

/**
 * @id 301108
 * @name 万世的浪涛
 * @description
 * 角色在本回合中，下次造成的伤害+2。
 */
export const AeonWave = status(301108)
  .oneDuration()
  .once("modifySkillDamage")
  .increaseDamage(2)
  .done();

/**
 * @id 311108
 * @name 万世流涌大典
 * @description
 * 角色造成的伤害+1。
 * 角色受到伤害或治疗后：如果本回合已受到伤害或治疗累计2次，则角色本回合中下次造成的伤害+2。（每回合1次）
 * （「法器」角色才能装备。角色最多装备1件「武器」）
 */
export const TomeOfTheEternalFlow = card(311108)
  .costSame(3)
  .weapon("catalyst")
  .variable("usagePerRound", 1)
  .on("actionPhase")
  .setVariable("usagePerRound", 1)
  .on("modifySkillDamage")
  .increaseDamage(1)
  .on("damaged")
  .do((c) => {
    if (c.getVariable("usagePerRound") > 0 &&
      c.self.master().state.damageLog.filter((v) => v.roundNumber === c.state.roundNumber).length >= 2) {
      c.characterStatus(AeonWave, "@master");
      c.addVariable("usagePerRound", -1);
    }
  })
  .on("healed")
  .do((c) => {
    if (c.getVariable("usagePerRound") > 0 &&
      c.self.master().state.damageLog.filter((v) => v.roundNumber === c.state.roundNumber).length >= 2) {
      c.characterStatus(AeonWave, "@master");
      c.addVariable("usagePerRound", -1);
    }
  })
  .done();
