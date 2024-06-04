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
 * @id 117081
 * @name 梅赫拉克的助力
 * @description
 * 角色「普通攻击」造成的伤害+1，且造成的物理伤害变为草元素伤害。
 * 角色普通攻击后：生成迸发扫描。
 * 持续回合：2
 */
export const MehraksAssistance = status(117081)
  // TODO
  .done();

/**
 * @id 117082
 * @name 迸发扫描
 * @description
 * 双方选择行动前：如果我方场上存在草原核或丰穰之核，则使其可用次数-1，并舍弃我方牌库顶的1张卡牌。然后，造成所舍弃卡牌原本元素骰费用+1的草元素伤害。
 * 可用次数：1（可叠加，最多叠加到3次）
 */
export const BurstScan = combatStatus(117082)
  // TODO
  .done();

/**
 * @id 117083
 * @name 预算师的技艺（生效中）
 * @description
 * 我方下次打出「场地」支援牌时：少花费2个元素骰。
 */
export const TheArtOfBudgetingInEffect = combatStatus(117083)
  // TODO
  .done();

/**
 * @id 17081
 * @name 旋规设矩
 * @description
 * 造成2点物理伤害。
 */
export const SchematicSetup = skill(17081)
  .type("normal")
  .costDendro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 17082
 * @name 画则巧施
 * @description
 * 造成2点草元素伤害，生成迸发扫描。
 */
export const ArtisticIngenuity = skill(17082)
  .type("elemental")
  .costDendro(3)
  // TODO
  .done();

/**
 * @id 17083
 * @name 繁绘隅穹
 * @description
 * 造成3点草元素伤害，本角色附属梅赫拉克的助力，生成2层迸发扫描。
 */
export const PaintedDome = skill(17083)
  .type("burst")
  .costDendro(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 1708
 * @name 卡维
 * @description
 * 体悟、仁爱与识美之知。
 */
export const Kaveh = character(1708)
  .tags("dendro", "claymore", "sumeru")
  .health(10)
  .energy(2)
  .skills(SchematicSetup, ArtisticIngenuity, PaintedDome)
  .done();

/**
 * @id 217081
 * @name 预算师的技艺
 * @description
 * 战斗行动：我方出战角色为卡维时，装备此牌。
 * 卡维装备此牌后，立刻使用一次画则巧施。
 * 装备有此牌的卡维在场，我方触发迸发扫描的效果后：将1张所舍弃卡牌的复制加入你的手牌。如果该牌为「场地」牌，则使本回合中我方下次打出「场地」时少花费2个元素骰。（每回合1次）
 * （牌组中包含卡维，才能加入牌组）
 */
export const TheArtOfBudgeting = card(217081)
  .costDendro(3)
  .talent(Kaveh)
  // TODO
  .done();
