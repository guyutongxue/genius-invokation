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

import { character, skill, summon, status, card, DamageType, SkillHandle, StatusHandle } from "@gi-tcg/core/builder";

/**
 * @id 123034
 * @name 炎之魔蝎·守势
 * @description
 * 魔蝎祝福在场时：所附属角色受到的伤害-1。（每回合至多2次）
 * @outdated
 * 厄灵·炎之魔蝎在场时：所附属角色受到的伤害-1。（每回合至多2次）
 */
export const PyroScorpionGuardianStance01: StatusHandle = status(123034)
  .conflictWith(123033)
  .on("decreaseDamaged", (c, e) => e.value > 0 &&
    c.$(`my summons with definition id ${SpiritOfOmenPyroScorpion01} or my summons with definition id ${SpiritOfOmenPyroScorpion}`))
  .usagePerRound(2)
  .decreaseDamage(1)
  .done();

/**
 * @id 123033
 * @name 炎之魔蝎·守势
 * @description
 * 厄灵·炎之魔蝎在场时：所附属角色受到的伤害-1。（每回合1次）
 */
export const PyroScorpionGuardianStance: StatusHandle = status(123033)
  .conflictWith(123034)
  .on("decreaseDamaged", (c, e) => e.value > 0 &&
    c.$(`my summons with definition id ${SpiritOfOmenPyroScorpion01} or my summons with definition id ${SpiritOfOmenPyroScorpion}`))
  .usagePerRound(1)
  .decreaseDamage(1)
  .done();

/**
 * @id 123032
 * @name 厄灵·炎之魔蝎
 * @description
 * 我方使用厄灵·炎之魔蝎的特技时：移除此效果，每有1层「魔蝎祝福」，就使此特技造成的伤害+1。
 * （「魔蝎祝福」的层数可叠加，没有上限）
 * @outdated
 * 结束阶段：造成1点火元素伤害；如果本回合中镀金旅团·炽沙叙事人使用过「普通攻击」或「元素战技」，则此伤害+1。
 * 可用次数：2
 * 入场时和行动阶段开始：使我方镀金旅团·炽沙叙事人附属炎之魔蝎·守势。（厄灵·炎之魔蝎在场时每回合至多2次，使角色受到的伤害-1。）
 */
export const SpiritOfOmenPyroScorpion01 = summon(123032)
  .conflictWith(123031)
  .hintIcon(DamageType.Pyro)
  .hintText("1")
  .on("endPhase")
  .usage(2)
  .do((c) => {
    if (c.countOfSkill(EremiteScorchingLoremaster, SearingGlare) > 0 ||
      c.countOfSkill(EremiteScorchingLoremaster, BlazingStrike) > 0) {
      c.damage(DamageType.Pyro, 2);
    } else {
      c.damage(DamageType.Pyro, 1);
    }
  })
  .on("enter")
  .if((c) => c.$(`my equipment with definition id ${Scorpocalypse}`))
  .characterStatus(PyroScorpionGuardianStance01, `my character with definition id 2303`)
  .else()
  .characterStatus(PyroScorpionGuardianStance, `my character with definition id 2303`)
  .on("actionPhase")
  .if((c) => c.$(`my equipment with definition id ${Scorpocalypse}`))
  .characterStatus(PyroScorpionGuardianStance01, `my character with definition id 2303`)
  .else()
  .characterStatus(PyroScorpionGuardianStance, `my character with definition id 2303`)
  .done();

/**
 * @id 123031
 * @name 厄灵·炎之魔蝎
 * @description
 * 结束阶段：造成1点火元素伤害。
 * 可用次数：2
 * 入场时和行动阶段开始：使我方镀金旅团·炽沙叙事人附属炎之魔蝎·守势。（厄灵·炎之魔蝎在场时每回合1次，使角色受到的伤害-1。）
 */
export const SpiritOfOmenPyroScorpion = summon(123031)
  .conflictWith(123032)
  .endPhaseDamage(DamageType.Pyro, 1)
  .usage(2)
  .on("enter")
  .if((c) => c.$(`my equipment with definition id ${Scorpocalypse}`))
  .characterStatus(PyroScorpionGuardianStance01, `my character with definition id 2303`)
  .else()
  .characterStatus(PyroScorpionGuardianStance, `my character with definition id 2303`)
  .on("actionPhase")
  .if((c) => c.$(`my equipment with definition id ${Scorpocalypse}`))
  .characterStatus(PyroScorpionGuardianStance01, `my character with definition id 2303`)
  .else()
  .characterStatus(PyroScorpionGuardianStance, `my character with definition id 2303`)
  .done();

/**
 * @id 23031
 * @name 烧蚀之光
 * @description
 * 造成1点火元素伤害。
 */
export const SearingGlare = skill(23031)
  .type("normal")
  .costPyro(1)
  .costVoid(2)
  .damage(DamageType.Pyro, 1)
  .done();

/**
 * @id 23032
 * @name 炎晶迸击
 * @description
 * 造成3点火元素伤害，生成1层魔蝎祝福。
 * @outdated
 * 造成3点火元素伤害。
 */
export const BlazingStrike = skill(23032)
  .type("elemental")
  .costPyro(3)
  .damage(DamageType.Pyro, 3)
  .done();

/**
 * @id 23033
 * @name 厄灵苏醒·炎之魔蝎
 * @description
 * 造成3点火元素伤害。整场牌局限制1次，将1张厄灵·炎之魔蝎加入我方手牌。
 * （装备有厄灵·炎之魔蝎的角色可以使用特技：炙烧攻势）
 * @outdated
 * 造成2点火元素伤害，召唤厄灵·炎之魔蝎。
 */
export const SpiritOfOmensAwakeningPyroScorpion: SkillHandle = skill(23033)
  .type("burst")
  .costPyro(3)
  .costEnergy(2)
  .damage(DamageType.Pyro, 2)
  .if((c) => c.self.hasEquipment(Scorpocalypse))
  .summon(SpiritOfOmenPyroScorpion01)
  .else()
  .summon(SpiritOfOmenPyroScorpion)
  .done();

/**
 * @id 23034
 * @name 厄灵之能
 * @description
 * 【被动】此角色受到伤害后：如果此角色生命值不多于7，则获得1点充能。（每回合1次）
 * @outdated
 * 【被动】此角色受到伤害后：如果此角色生命值不多于7，则获得1点充能。（整场牌局限制1次）
 */
export const SpiritOfOmensPower = skill(23034)
  .type("passive")
  .on("damaged")
  .usage(1, { name: "damagedEnergySkillUsage", autoDispose: false })
  .if((c) => c.self.health <= 7)
  .gainEnergy(1, "@self")
  .done();

/**
 * @id 23035
 * @name 
 * @description
 * 每回合开始将此角色计数器清零
 */
export const _23035 = skill(23035)
  .reserve();

/**
 * @id 23036
 * @name 炎之魔蝎·守势
 * @description
 * 每回合开始如果场上存在召唤物刷新盾
 */
export const PyroScorpionGuardianStanceSkill = skill(23036)
  .reserve();

/**
 * @id 23037
 * @name 炎之魔蝎·守势
 * @description
 * 每回合开始如果场上存在召唤物刷新盾（天赋）
 */
export const PyroScorpionGuardianStanceSkill01 = skill(23037)
  .reserve();

/**
 * @id 2303
 * @name 镀金旅团·炽沙叙事人
 * @description
 * 如今仍然能记起许多故事的人，是不会背叛流淌在体内的沙漠血脉的。
 */
export const EremiteScorchingLoremaster = character(2303)
  .since("v4.3.0")
  .tags("pyro", "eremite")
  .health(10)
  .energy(2)
  .skills(SearingGlare, BlazingStrike, SpiritOfOmensAwakeningPyroScorpion, SpiritOfOmensPower)
  .done();

/**
 * @id 223031
 * @name 魔蝎烈祸
 * @description
 * 战斗行动：我方出战角色为镀金旅团·炽沙叙事人时，装备此牌。
 * 镀金旅团·炽沙叙事人装备此牌后，立刻使用一次炎晶迸击。
 * 装备有此牌的镀金旅团·炽沙叙事人在场，我方使用炙烧攻势击倒敌方角色后：将1张厄灵·炎之魔蝎加入手牌。
 * 回合结束时：生成1层魔蝎祝福。
 * （牌组中包含镀金旅团·炽沙叙事人，才能加入牌组）
 * @outdated
 * 战斗行动：我方出战角色为镀金旅团·炽沙叙事人时，装备此牌。
 * 镀金旅团·炽沙叙事人装备此牌后，立刻使用一次厄灵苏醒·炎之魔蝎。
 * 装备有此牌的镀金旅团·炽沙叙事人生成的厄灵·炎之魔蝎在镀金旅团·炽沙叙事人使用过「普通攻击」或「元素战技」的回合中，造成的伤害+1；
 * 厄灵·炎之魔蝎的减伤效果改为每回合至多2次。
 * （牌组中包含镀金旅团·炽沙叙事人，才能加入牌组）
 */
export const Scorpocalypse = card(223031)
  .since("v4.3.0")
  .costPyro(3)
  .costEnergy(2)
  .talent(EremiteScorchingLoremaster)
  .on("enter")
  .useSkill(SpiritOfOmensAwakeningPyroScorpion)
  .done();
