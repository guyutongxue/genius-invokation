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

import { DiceType, card } from "@gi-tcg/core/builder";

/**
 * @id 330001
 * @name 旧时庭园
 * @description
 * 我方有角色已装备「武器」或「圣遗物」时，才能打出：本回合中，我方下次打出「武器」或「圣遗物」装备牌时少花费2个元素骰。
 * （整局游戏只能打出一张「秘传」卡牌；这张牌一定在你的起始手牌中）
 */
export const AncientCourtyard = card(330001)
  .legend()
  .filter((c) => c.$("my character has equipment with tag (weapon) or my character has equipment with tag (artifact)"))
  .toCombatStatus(300001)
  .oneDuration()
  .on("deductDiceCard", (c, e) => e.hasOneOfCardTag("weapon", "artifact"))
  .deductCost(DiceType.Omni, 2)
  .done();

/**
 * @id 330002
 * @name 磐岩盟契
 * @description
 * 我方剩余元素骰数量为0时，才能打出：生成2个不同的基础元素骰。
 * （整局游戏只能打出一张「秘传」卡牌；这张牌一定在你的起始手牌中）
 */
export const CovenantOfRock = card(330002)
  .legend()
  .filter((c) => c.player.dice.length === 0)
  .generateDice("randomElement", 2)
  .done();

/**
 * @id 330003
 * @name 愉舞欢游
 * @description
 * 我方出战角色的元素类型为冰/水/火/雷/草时，才能打出：对我方所有具有元素附着的角色，附着我方出战角色类型的元素。
 * （整局游戏只能打出一张「秘传」卡牌；这张牌一定在你的起始手牌中）
 */
export const JoyousCelebration = card(330003)
  .legend()
  .filter((c) => [DiceType.Cryo, DiceType.Hydro, DiceType.Pyro, DiceType.Electro, DiceType.Dendro].includes(c.$("my active")!.element()))
  .do((c) => {
    const element = c.$("my active")!.element() as 1 | 2 | 3 | 4 | 7;
    // 先挂后台再挂前台（避免前台被超载走导致结算错误）
    c.apply(element, "my standby character with aura != 0");
    c.apply(element, "my active character with aura != 0");
  })
  .done();


/**
 * @id 330004
 * @name 自由的新风
 * @description
 * 本回合中，轮到我方行动期间有对方角色被击倒时：本次行动结束后，我方可以再连续行动一次。
 * 可用次数：1
 * （整局游戏只能打出一张「秘传」卡牌；这张牌一定在你的起始手牌中）
 */
export const FreshWindOfFreedom = card(330004)
  .legend()
  .toCombatStatus(300002)
  .oneDuration()
  .on("defeated", (c, e) => c.state.phase === "action" && c.isMyTurn() && !c.of(e.target).isMine())
  .listenToAll()
  .usage(1)
  .do((c) => {
    c.mutate({
      type: "setPlayerFlag",
      who: (1 - c.self.who) as 0 | 1,
      flagName: "skipNextTurn",
      value: true
    });
  })
  .done();

/**
 * @id 330005
 * @name 万家灶火
 * @description
 * 第1回合打出此牌时：如果我方牌组中初始包含至少2张不同的「天赋」牌，则抓1张「天赋」牌。
 * 第2回合及以后打出此牌时：我方抓当前的回合数-1数量的牌。（最多抓4张）
 * （整局游戏只能打出一张「秘传」卡牌；这张牌一定在你的起始手牌中）
 * @outdated
 * 我方抓当前的回合数-1数量的牌。（最多抓4张）
 * （整局游戏只能打出一张「秘传」卡牌；这张牌一定在你的起始手牌中）
 */
export const InEveryHouseAStove = card(330005)
  .legend()
  .do((c) => {
    const count = c.state.roundNumber - 1;
    c.drawCards(count);
  })
  .done();

/**
 * @id 330006
 * @name 裁定之时
 * @description
 * 本回合中，对方牌手打出的3张事件牌无效。
 * （整局游戏只能打出一张「秘传」卡牌；这张牌一定在你的起始手牌中）
 */
export const PassingOfJudgment = card(330006)
  .costSame(1)
  .legend()
  .toCombatStatus(300003, "opp")
  .tags("disableEvent")
  .oneDuration()
  .on("playCard", (c, e) => e.action.card.definition.type === "event")
  .usage(3)
  .done();

/**
 * @id 330007
 * @name 抗争之日·碎梦之时
 * @description
 * 本回合中，目标我方角色受到的伤害-1。（最多生效4次）
 * （整局游戏只能打出一张「秘传」卡牌；这张牌一定在你的起始手牌中）
 */
export const DayOfResistanceMomentOfShatteredDreams = card(330007)
  .legend()
  .addTarget("my character")
  .toStatus("@targets.0", 300004)
  .oneDuration()
  .on("beforeDamaged")
  .usage(4)
  .decreaseDamage(1)
  .done();

/**
 * @id 330008
 * @name 旧日鏖战
 * @description
 * 敌方出战角色失去1点充能。
 * （整局游戏只能打出一张「秘传」卡牌；这张牌一定在你的起始手牌中）
 */
export const ViciousAncientBattle = card(330008)
  .legend()
  // TODO
  .done();
