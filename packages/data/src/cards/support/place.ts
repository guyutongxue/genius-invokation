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

import { DiceType, EntityState, card, combatStatus } from "@gi-tcg/core/builder";

/**
 * @id 321001
 * @name 璃月港口
 * @description
 * 结束阶段：抓2张牌。
 * 可用次数：2
 */
export const LiyueHarborWharf = card(321001)
  .costSame(2)
  .support("place")
  .on("endPhase")
  .usage(2)
  .drawCards(2)
  .done();

/**
 * @id 321002
 * @name 骑士团图书馆
 * @description
 * 入场时：选择任意元素骰重投。
 * 投掷阶段：获得额外一次重投机会。
 */
export const KnightsOfFavoniusLibrary = card(321002)
  .support("place")
  .on("enter")
  .reroll(1)
  .on("roll")
  .addRerollCount(1)
  .done();

/**
 * @id 321003
 * @name 群玉阁
 * @description
 * 投掷阶段：2个元素骰初始总是投出我方出战角色类型的元素。
 * 行动阶段开始时：如果我方手牌数量不多于3，则弃置此牌，生成1个万能元素。
 */
export const JadeChamber = card(321003)
  .support("place")
  .on("roll")
  .do((c, e) => {
    e.fixDice(c.$("my active")!.element(), 2);
  })
  .on("actionPhase")
  .if((c) => c.player.hands.length <= 3)
  .generateDice(DiceType.Omni, 1)
  .dispose()
  .done();

/**
 * @id 321004
 * @name 晨曦酒庄
 * @description
 * 我方执行「切换角色」行动时：少花费1个元素骰。（每回合1次）
 */
export const DawnWinery = card(321004)
  .costSame(2)
  .support("place")
  .on("deductDiceSwitch")
  .usagePerRound(1)
  .deductCost(DiceType.Omni, 1)
  .done();

/**
 * @id 321005
 * @name 望舒客栈
 * @description
 * 结束阶段：治疗受伤最多的我方后台角色2点。
 * 可用次数：2
 */
export const WangshuInn = card(321005)
  .costSame(2)
  .support("place")
  .on("endPhase")
  .usage(2)
  .heal(2, "my standby characters order by (maxHealth - health) limit 1")
  .done();

/**
 * @id 321006
 * @name 西风大教堂
 * @description
 * 结束阶段：治疗我方「出战角色」2点。
 * 可用次数：2
 */
export const FavoniusCathedral = card(321006)
  .costSame(2)
  .support("place")
  .on("endPhase")
  .usage(2)
  .heal(2, "my active")
  .done();

/**
 * @id 321007
 * @name 天守阁
 * @description
 * 行动阶段开始时：如果我方的元素骰包含5种不同的元素，则生成1个万能元素。
 */
export const Tenshukaku = card(321007)
  .costSame(2)
  .support("place")
  .on("actionPhase")
  .if((c) => new Set(c.player.dice).size >= 5)
  .generateDice(DiceType.Omni, 1)
  .done();

/**
 * @id 321008
 * @name 鸣神大社
 * @description
 * 每回合自动触发1次：生成1个随机的基础元素骰。
 * 可用次数：3
 */
export const GrandNarukamiShrine = card(321008)
  .costSame(2)
  .support("place")
  .on("enter")
  .generateDice("randomElement", 1)
  .on("actionPhase")
  .usage(2)
  .generateDice("randomElement", 1)
  .done();

/**
 * @id 321009
 * @name 珊瑚宫
 * @description
 * 结束阶段：治疗所有我方角色1点。
 * 可用次数：2
 */
export const SangonomiyaShrine = card(321009)
  .costSame(2)
  .support("place")
  .on("endPhase")
  .usage(2)
  .heal(1, "all my characters")
  .done();

/**
 * @id 321010
 * @name 须弥城
 * @description
 * 我方打出「天赋」牌或我方角色使用技能时：如果我方元素骰数量不多于手牌数量，则少花费1个元素骰。（每回合1次）
 * @outdated
 * 我方角色使用技能或装备「天赋」时：如果我方元素骰数量不多于手牌数量，则少花费1个元素骰。（每回合1次）
 */
export const SumeruCity = card(321010)
  .costSame(2)
  .support("place")
  .on("deductDice", (c, e) =>
    (e.isUseSkill() || e.hasCardTag("talent")) && 
    (c.player.dice.length <= c.player.hands.length))
  .usagePerRound(1)
  .deductCost(DiceType.Omni, 1)
  .done();

/**
 * @id 321011
 * @name 桓那兰那
 * @description
 * 结束阶段：收集最多2个未使用的元素骰。
 * 行动阶段开始时：拿回此牌所收集的元素骰。
 */
export const Vanarana = card(321011)
  .support("place")
  .variable("count", 0)
  .variable("d1", 0, { visible: false })
  .variable("d2", 0, { visible: false })
  .on("endPhase")
  .do((c) => {
    const absorbed = c.absorbDice("seq", 2);
    c.setVariable("count", absorbed.length);
    c.setVariable("d1", absorbed[0] ?? 0);
    c.setVariable("d2", absorbed[1] ?? 0);
  })
  .on("actionPhase")
  .do((c) => {
    if (c.getVariable("count") === 2) {
      c.generateDice(c.getVariable("d1"), 1);
      c.generateDice(c.getVariable("d2"), 1);
    } else if (c.getVariable("count") === 1) {
      c.generateDice(c.getVariable("d1"), 1);
    }
  })
  .setVariable("count", 0)
  .done();

/**
 * @id 321012
 * @name 镇守之森
 * @description
 * 行动阶段开始时：如果我方不是「先手牌手」，则生成1个出战角色类型的元素骰。
 * 可用次数：3
 */
export const ChinjuForest = card(321012)
  .costSame(1)
  .support("place")
  .on("actionPhase", (c) => !c.isMyTurn())
  .usage(3)
  .do((c) => {
    c.generateDice(c.$("my active")!.element(), 1);
  })
  .done();

/**
 * @id 321013
 * @name 黄金屋
 * @description
 * 我方打出原本元素骰费用至少为3的「武器」或「圣遗物」手牌时：少花费1个元素骰。（每回合1次）
 * 可用次数：2
 */
export const GoldenHouse = card(321013)
  .support("place")
  .on("deductDiceCard", (c, e) =>
    e.hasOneOfCardTag("weapon", "artifact") &&
    e.action.card.definition.skillDefinition.requiredCost.length >= 3)
  .usagePerRound(1)
  .deductCost(DiceType.Omni, 1)
  .done();

/**
 * @id 321014
 * @name 化城郭
 * @description
 * 我方选择行动前，元素骰数量为0时：生成1个万能元素。（每回合1次）
 * 可用次数：3
 */
export const GandharvaVille = card(321014)
  .costSame(1)
  .support("place")
  .on("beforeAction", (c) => c.player.dice.length === 0)
  .usagePerRound(1)
  .generateDice(DiceType.Omni, 1)
  .done();

/**
 * @id 321015
 * @name 风龙废墟
 * @description
 * 入场时：从牌组中随机抽取一张「天赋」牌。
 * 我方打出「天赋」牌，或我方角色使用原本元素骰消耗至少为4的技能时：少花费1个元素骰。（每回合1次）
 * 可用次数：3
 */
export const StormterrorsLair = card(321015)
  .costSame(2)
  .support("place")
  .on("enter")
  .drawCards(1, { withTag: "talent" })
  .on("deductDice", (c, e) => {
    return e.hasCardTag("talent") ||
      (e.isUseSkill() && e.action.skill.definition.requiredCost.length >= 4);
  })
  .usage(3)
  .usagePerRound(1)
  .deductCost(DiceType.Omni, 1)
  .done();

/**
 * @id 321016
 * @name 湖中垂柳
 * @description
 * 结束阶段：如果我方手牌数量不多于2，则抓2张牌。
 * 可用次数：2
 */
export const WeepingWillowOfTheLake = card(321016)
  .costSame(1)
  .support("place")
  .on("endPhase", (c) => c.player.hands.length <= 2)
  .usage(2)
  .drawCards(2)
  .done();

/**
 * @id 321017
 * @name 欧庇克莱歌剧院
 * @description
 * 我方选择行动前：如果我方角色所装备卡牌的原本元素骰费用总和不比对方更低，则生成1个出战角色类型的元素骰。（每回合1次）
 * 可用次数：3
 */
export const OperaEpiclese = card(321017)
  .costSame(1)
  .support("place")
  .on("beforeAction", (c) => {
    function costOfEquipment(equipment: EntityState) {
      const cardDef = c.state.data.cards.get(equipment.definition.id)!;
      return cardDef.skillDefinition.requiredCost.length;
    }
    const myCost = c.$$(`my equipments`).map((entity) => costOfEquipment(entity.state)).reduce((a, b) => a + b, 0);
    const oppCost = c.$$(`opp equipments`).map((entity) => costOfEquipment(entity.state)).reduce((a, b) => a + b, 0);
    return myCost >= oppCost;
  })
  .usage(3)
  .usagePerRound(1)
  .do((c) => {
    c.generateDice(c.$("my active")!.element(), 1);
  })
  .done();

/**
 * @id 301018
 * @name 严格禁令
 * @description
 * 本回合中，所在阵营打出的事件牌无效。
 * 可用次数：1
 */
export const StrictProhibited = combatStatus(301018)
  .tags("disableEvent")
  .oneDuration()
  .on("playCard", (c, e) => e.action.card.definition.type === "event")
  .usage(1)
  .done();

/**
 * @id 321018
 * @name 梅洛彼得堡
 * @description
 * 我方出战角色受到伤害或治疗后：此牌累积1点「禁令」。（最多累积到4点）
 * 行动阶段开始时：如果此牌已有4点「禁令」，则消耗4点，在对方场上生成严格禁令。（本回合中打出的1张事件牌无效）
 */
export const FortressOfMeropide = card(321018)
  .costSame(1)
  .support("place")
  .variable("forbidden", 0)
  .on("damagedOrHealed", (c, e) => c.of(e.target).isActive())
  .addVariableWithMax("forbidden", 1, 4)
  .on("actionPhase")
  .do((c) => {
    if (c.getVariable("forbidden") >= 4) {
      c.combatStatus(StrictProhibited, "opp");
      c.addVariable("forbidden", -4);
    }
  })
  .done();
