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

import { character, skill, status, combatStatus, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 116071
 * @name 旋云护盾
 * @description
 * 准备技能期间：提供2点护盾，保护所附属的角色。
 */
export const ShieldOfSwirlingClouds = status(116071)
  // TODO
  .done();

/**
 * @id 116072
 * @name 长枪开相
 * @description
 * 本角色将在下次行动时，直接使用技能：长枪开相。
 */
export const SpearFlourishStatus = status(116072)
  // TODO
  .done();

/**
 * @id 116073
 * @name 飞云旗阵
 * @description
 * 我方角色进行普通攻击时：造成的伤害+1。
 * 如果我方手牌数量不多于1，则此技能少花费1个元素骰。
 * 可用次数：1（可叠加，最多叠加到4次）
 */
export const FlyingCloudFlagFormation = combatStatus(116073)
  // TODO
  .done();

/**
 * @id 16071
 * @name 拂云出手
 * @description
 * 造成2点物理伤害。
 */
export const CloudgrazingStrike = skill(16071)
  .type("normal")
  .costGeo(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 16072
 * @name 旋云开相
 * @description
 * 生成飞云旗阵，本角色附属旋云护盾并准备技能：长枪开相。
 */
export const OpeningFlourish = skill(16072)
  .type("elemental")
  .costGeo(3)
  // TODO
  .done();

/**
 * @id 16073
 * @name 破嶂见旌仪
 * @description
 * 造成2点岩元素伤害，生成3层飞云旗阵。
 */
export const CliffbreakersBanner = skill(16073)
  .type("burst")
  .costGeo(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 16074
 * @name 长枪开相
 * @description
 * 造成2点岩元素伤害；如果本回合中我方舍弃或调和过至少1张牌，则此伤害+1。
 */
export const SpearFlourish = skill(16074)
  .type("elemental")
  .if((c) => c.self.getVariable("disposeOrTuneCardCount") > 0)
  .damage(DamageType.Geo, 3)
  .else()
  .damage(DamageType.Geo, 2)
  .done();

/**
 * @id 16075
 * @name 
 * @description
 * 
 */
export const CountDisposeOrTune = skill(16075)
  .type("passive")
  .variable("disposeOrTuneCardCount", 0)
  .on("disposeOrTuneCard")
  .addVariable("disposeOrTuneCardCount", 1)
  .on("roundBegin")
  .setVariable("disposeOrTuneCardCount", 0)
  .done();

/**
 * @id 1607
 * @name 云堇
 * @description
 * 红毹婵娟，庄谐并举。
 */
export const YunJin = character(1607)
  .tags("geo", "pole", "liyue")
  .health(10)
  .energy(2)
  .skills(CloudgrazingStrike, OpeningFlourish, CliffbreakersBanner, CountDisposeOrTune)
  .done();

/**
 * @id 216071
 * @name 庄谐并举
 * @description
 * 战斗行动：我方出战角色为云堇时，装备此牌。
 * 云堇装备此牌后，立刻使用一次破嶂见旌仪。
 * 装备有此牌的云堇在场时，如果我方没有手牌，则飞云旗阵会使普通攻击造成的伤害额外+2。
 * （牌组中包含云堇，才能加入牌组）
 */
export const DecorousHarmony = card(216071)
  .costGeo(3)
  .costEnergy(2)
  .talent(YunJin)
  // TODO
  .done();
