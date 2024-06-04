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

import { character, skill, summon, status, combatStatus, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 127022
 * @name 增殖生命体
 * @description
 * 结束阶段：造成1点草元素伤害。
 * 可用次数：1
 */
export const ProliferatedOrganism01 = summon(127022)
  // TODO
  .done();

/**
 * @id 127023
 * @name 增殖生命体
 * @description
 * 结束阶段：造成1点草元素伤害。
 * 可用次数：1
 */
export const ProliferatedOrganism02 = summon(127023)
  // TODO
  .done();

/**
 * @id 127024
 * @name 增殖生命体
 * @description
 * 结束阶段：造成1点草元素伤害。
 * 可用次数：1
 */
export const ProliferatedOrganism03 = summon(127024)
  // TODO
  .done();

/**
 * @id 127025
 * @name 增殖生命体
 * @description
 * 结束阶段：造成1点草元素伤害。
 * 可用次数：1
 */
export const ProliferatedOrganism04 = summon(127025)
  // TODO
  .done();

/**
 * @id 127028
 * @name 绿洲之庇护
 * @description
 * 提供2点护盾，保护所附属角色。
 */
export const OasissAegis = status(127028)
  // TODO
  .done();

/**
 * @id 127027
 * @name 重燃的绿洲之心
 * @description
 * 所附属角色造成的伤害+3。
 * 所附属角色使用技能后：移除我方场上的绿洲之滋养，每移除1层就治疗所附属角色1点。
 */
export const ReignitedHeartOfOasis = status(127027)
  // TODO
  .done();

/**
 * @id 127029
 * @name 绿洲之心
 * @description
 * 我方召唤4个增殖生命体后，我方阿佩普的绿洲守望者附属重燃的绿洲之心，并获得2点护盾。
 */
export const HeartOfOasis = combatStatus(127029)
  // TODO
  .done();

/**
 * @id 127026
 * @name 绿洲之滋养
 * @description
 * 我方打出唤醒眷属时：少花费1个元素骰。
 * 可用次数：1（可叠加到3）
 */
export const OasisNourishment = combatStatus(127026)
  // TODO
  .done();

/**
 * @id 27021
 * @name 失乡重击
 * @description
 * 造成2点物理伤害。
 */
export const StrikeOfTheDispossessed = skill(27021)
  .type("normal")
  .costDendro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 27022
 * @name 生命流束
 * @description
 * 造成2点草元素伤害，抓1张唤醒眷属，生成1层绿洲之滋养。
 */
export const LifeStream = skill(27022)
  .type("elemental")
  .costDendro(3)
  // TODO
  .done();

/**
 * @id 27023
 * @name 终景迸落
 * @description
 * 造成2点草元素伤害，抓1张唤醒眷属，生成2层绿洲之滋养。
 */
export const TheEndFalls = skill(27023)
  .type("burst")
  .costDendro(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 27024
 * @name 增殖感召
 * @description
 * 【被动】战斗开始时，生成6张唤醒眷属，随机放入牌库。我方召唤4个增殖生命体后，此角色附属重燃的绿洲之心，并获得2点护盾。
 */
export const InvokationOfPropagation = skill(27024)
  .type("passive")
  // TODO
  .done();

/**
 * @id 2702
 * @name 阿佩普的绿洲守望者
 * @description
 * 阿佩普曾独自沉溺于末日的风景当中。所有的人、神、龙、走兽、飞鸟与游鱼，所有记忆、智慧、话语与仇恨将都磨为无色尘粉，最后一轮明月之光则化作白焰之雨落在荒土之上。
 * ……
 * 阿佩普曾视沙海之底为自己的墓场，而非失乡之王的行宫。「智慧」的毒很快就会让它从无数个月亮的仇恨与愤怒中解脱。它已经对终末缺乏颜色的景象感到厌倦了。直到最终年轻的神明与金色的旅人让它再度回想起，即便自己曾经主宰的青绿土地已经化作饰金的荒原，即便自己与子嗣为了在其中生存而变得扭曲丑陋，但它的心中始终珍藏着那一角绿洲的景象。
 */
export const GuardianOfApepsOasis = character(2702)
  .tags("dendro", "monster")
  .health(10)
  .energy(2)
  .skills(StrikeOfTheDispossessed, LifeStream, TheEndFalls, InvokationOfPropagation)
  .done();

/**
 * @id 227021
 * @name 万千子嗣
 * @description
 * 入场时：生成4张唤醒眷属，随机置入我方牌库。
 * 装备有此牌的阿佩普的绿洲守望者在场时:我方增殖生命体造成的伤害+1。
 * （牌组中包含阿佩普的绿洲守望者，才能加入牌组）
 */
export const AThousandYoung = card(227021)
  .costDendro(2)
  .talent(GuardianOfApepsOasis)
  // TODO
  .done();
