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

import { OverchargedBall } from "../../cards/event/other";
import { character, skill, status, combatStatus, card, DamageType, Reaction } from "@gi-tcg/core/builder";

/**
 * @id 113135
 * @name 纵阵武力统筹
 * @description
 * 敌方角色受到超载反应伤害后：生成手牌超量装药弹头（每回合1次）
 */
export const VerticalForceCoordination = status(113135)
  .since("v4.8.0")
  .on("reaction", (c, e) => e.type === Reaction.Overloaded)
  .usagePerRound(1)
  .createHandCard(OverchargedBall)
  .done();

/**
 * @id 113132
 * @name 二重毁伤弹
 * @description
 * 所在阵营切换角色后：对切换到的角色造成1点火元素伤害。
 * 可用次数：2
 */
export const SecondaryExplosiveShells = combatStatus(113132)
  .since("v4.8.0")
  .on("switchActive")
  .usage(2)
  .damage(DamageType.Pyro, 1, "@event.switchTo")
  .done();

/**
 * @id 113134
 * @name 尖兵协同战法（生效中）
 * @description
 * 我方造成的火元素伤害或雷元素伤害+1。（包括扩散反应造成的火元素伤害或雷元素伤害）
 * 可用次数：2
 */
export const VanguardsCoordinatedTacticsInEffect = combatStatus(113134)
  .since("v4.8.0")
  // TODO
  // .on("modifyDamage", (e) => e.type === DamageType.Pyro || e.type === DamageType.Electro)
  // .increaseDamage(1)
  .done();

/**
 * @id 13131
 * @name 线列枪刺·改
 * @description
 * 造成2点物理伤害。
 */
export const LineBayonetThrustEx = skill(13131)
  .type("normal")
  .costPyro(1)
  .costVoid(2)
  .damage(DamageType.Physical, 2)
  .done();

/**
 * @id 13132
 * @name 近迫式急促拦射
 * @description
 * 造成2点火元素伤害。
 * 此技能结算后：如果我方手牌中含有超量装药弹头，则舍弃1张并治疗我方受伤最多的角色1点。
 */
export const ShortrangeRapidInterdictionFire = skill(13132)
  .type("elemental")
  .costPyro(3)
  .damage(DamageType.Pyro, 2)
  // TODO
  .done();

/**
 * @id 13133
 * @name 圆阵掷弹爆轰术
 * @description
 * 造成2点火元素伤害，在敌方场上生成二重毁伤弹。
 */
export const RingOfBurstingGrenades = skill(13133)
  .type("burst")
  .costPyro(3)
  .costEnergy(2)
  .damage(DamageType.Pyro, 2)
  .combatStatus(SecondaryExplosiveShells, "opp")
  .done();

/**
 * @id 13134
 * @name 纵阵武力统筹
 * @description
 * 【被动】敌方角色受到超载反应伤害后：生成手牌超量装药弹头（每回合1次）
 */
export const VerticalForceCoordinationPassive = skill(13134)
  .type("passive")
  .on("reaction", (c, e) => e.type === Reaction.Overloaded)
  .usagePerRound(1, { name: "usagePerRound1" })
  .createHandCard(OverchargedBall)
  .done();

/**
 * @id 13135
 * @name 近迫式急促拦射
 * @description
 * 造成3点火元素伤害。
 * 此技能结算后：如果我方手牌中含有超量装药弹头，则舍弃1张并治疗我方受伤最多的角色1点。
 */
export const ShortrangeRapidInterdictionFirePassive = skill(13135)
  .type("elemental")
  .costPyro(3)
  .damage(DamageType.Pyro, 3)
  // TODO
  .done();

/**
 * @id 1313
 * @name 夏沃蕾
 * @description
 * 知刑执法，公义责罪。
 */
export const Chevreuse = character(1313)
  .since("v4.8.0")
  .tags("pyro", "pole", "fontaine", "pneuma")
  .health(10)
  .energy(2)
  .skills(LineBayonetThrustEx, ShortrangeRapidInterdictionFire, RingOfBurstingGrenades, VerticalForceCoordinationPassive, ShortrangeRapidInterdictionFirePassive)
  .done();

/**
 * @id 213131
 * @name 尖兵协同战法
 * @description
 * 队伍中包含火元素角色和雷元素角色且不包含其他元素的角色，才能打出：将此牌装备给夏沃蕾。
 * 装备有此牌的夏沃蕾在场，敌方角色受到超载反应伤害后：我方接下来造成的2次火元素伤害或雷元素伤害+1。（包括扩散反应造成的火元素伤害或雷元素伤害）
 * （牌组中包含夏沃蕾，才能加入牌组）
 */
export const VanguardsCoordinatedTactics = card(213131)
  .costPyro(2)
  .talent(Chevreuse)
  .since("v4.8.0")
  // TODO
  .done();
