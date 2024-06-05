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

import { character, skill, summon, status, combatStatus, card, DamageType, diceCostOfCard } from "@gi-tcg/core/builder";

/**
 * @id 122043
 * @name 黑色幻影
 * @description
 * 入场时：获得我方已吞噬卡牌中最高元素骰费用值的「攻击力」，获得该费用的已吞噬卡牌数量的可用次数。
 * 结束阶段和我方宣布结束时：造成此牌「攻击力」值的雷元素伤害。
 * 我方出战角色受到伤害时：抵消1点伤害，然后此牌可用次数-2。
 */
export const DarkShadow = summon(122043)
  .usage(0)
  .variable("atk", 0)
  .hintIcon(DamageType.Electro)
  .hintText("[GCG_TOKEN_USR1]")
  .replaceDescription("[GCG_TOKEN_USR1]", (c, e) => e.variables.atk)
  .on("enter")
  .do((c) => {
    const domain = c.$(`my combat status with definition id ${DeepDevourersDomain}`)!;
    const maxCost = domain.getVariable("totalMaxCost");
    const count = domain.getVariable("totalMaxCostCount");
    c.setVariable("atk", maxCost);
    c.setVariable("usage", count);
  })
  .on("endPhase")
  .do((c) => {
    c.damage(DamageType.Electro, c.getVariable("atk"));
    c.consumeUsage();
  })
  .on("declareEnd")
  .do((c) => {
    c.damage(DamageType.Electro, c.getVariable("atk"));
    c.consumeUsage();
  })
  .on("beforeDamaged", (c, e) => c.of(e.target).isActive())
  .decreaseDamage(1)
  .consumeUsage(2)
  .done();

/**
 * @id 122042
 * @name 奇异之躯
 * @description
 * 每层为吞星之鲸提供1点最大生命。
 */
export const AnomalousAnatomy = status(122042)
  .variableCanAppend("extraMaxHealth", 1, Infinity)
  .on("enter")
  .do((c) => {
    c.mutate({
      type: "modifyEntityVar",
      state: c.self.master().state,
      varName: "maxHealth",
      value: 5 + c.getVariable("extraMaxHealth"),
    });
  })
  .on("dispose")
  .do((c) => {
    c.mutate({
      type: "modifyEntityVar",
      state: c.self.master().state,
      varName: "maxHealth",
      value: 5,
    });
  })
  .done();

/**
 * @id 122045
 * @name 吞噬冲动
 * @description
 * 回合开始时：舍弃原本元素骰费用最高的2张手牌，治疗该角色1点生命值，并抓1张牌。
 */
export const DevourersImpulse = status(122045)
  // TODO
  .done();

/**
 * @id 122044
 * @name 吞噬本能
 * @description
 * 回合开始时：舍弃原本元素骰费用最高的1张手牌。
 */
export const DevourersInstinct = status(122044)
  // TODO
  .done();

function doEat(c: any, cost: number) {
  c.addVariable("cardCount", 1);
  switch (c.getVariable("cardCount")) {
    case 1: {
      c.setVariable("card0Cost", cost);
      break;
    }
    case 2: {
      c.setVariable("card1Cost", cost);
      break;
    }
    case 3: {
      const card0Cost = c.getVariable("card0Cost");
      const card1Cost = c.getVariable("card1Cost");
      const card2Cost = cost;
      const distinctCostCount = new Set([card0Cost, card1Cost, card2Cost]).size;
      const extraMaxHealth = 4 - distinctCostCount;
      const narwhal = c.$(`my character with definition id ${AlldevouringNarwhal}`);
      if (narwhal) {
        narwhal.addStatus(AnomalousAnatomy, {
          overrideVariables: { extraMaxHealth }
        });
      }
      c.setVariable("cardCount", 0);
      break;
    }
  }
  const previousTotalMaxCost = c.getVariable("totalMaxCost");
  if (cost === previousTotalMaxCost) {
    c.addVariable("totalMaxCostCount", 1);
  } else if (cost > previousTotalMaxCost) {
    c.setVariable("totalMaxCost", cost);
    c.setVariable("totalMaxCostCount", 1);
  }
}

/**
 * @id 122041
 * @name 深噬之域
 * @description
 * 我方舍弃或调和的手牌，会被吞噬。
 * 每吞噬3张牌：吞星之鲸获得1点额外最大生命；如果其中存在原本元素骰费用值相同的牌，则额外获得1点；如果3张均相同，再额外获得1点。
 */
export const DeepDevourersDomain = combatStatus(122041)
  .variable("cardCount", 0)
  .variable("totalMaxCost", 0)
  .variable("totalMaxCostCount", 0)
  .variable("card0Cost", 0)
  .variable("card1Cost", 0)
  .on("disposeCard")
  .do((c, e) => {
    const cost = diceCostOfCard(e.card.definition);
    doEat(c, cost);
  })
  .on("elementalTuning")
  .do((c, e) => {
    const cost = diceCostOfCard(e.action.card.definition);
    doEat(c, cost);
  })
  .done();

/**
 * @id 22041
 * @name 碎涛旋跃
 * @description
 * 造成2点物理伤害。
 */
export const ShatteringWaves = skill(22041)
  .type("normal")
  .costHydro(1)
  .costVoid(2)
  .damage(DamageType.Physical, 2)
  .done();

/**
 * @id 22042
 * @name 迸落星雨
 * @description
 * 造成2点水元素伤害，此角色每有3点无尽食欲提供的额外最大生命，此伤害+1（最多+5）。然后舍弃1张原本元素骰费用最高的手牌。
 */
export const StarfallShower = skill(22042)
  .type("elemental")
  .costHydro(3)
  .do((c) => {
    const st = c.self.hasStatus(AnomalousAnatomy);
    const extraDmg = st ? Math.floor(c.of(st).getVariable("extraMaxHealth") / 3) : 0;
    c.damage(DamageType.Hydro, 2 + extraDmg);
    const cards = c.getMaxCostHands();
    c.disposeCard(c.random(...cards));
  })
  .done();

/**
 * @id 22043
 * @name 横噬鲸吞
 * @description
 * 造成1点水元素伤害，对敌方所有后台角色造成1点穿透伤害。召唤黑色幻影。
 */
export const RavagingDevourer = skill(22043)
  .type("burst")
  .costHydro(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 22044
 * @name 无尽食欲
 * @description
 * 【被动】战斗开始时，生成深噬之域。
 */
export const InsatiableAppetite = skill(22044)
  .type("passive")
  .on("battleBegin")
  .combatStatus(DeepDevourersDomain)
  .done();

/**
 * @id 2204
 * @name 吞星之鲸
 * @description
 * 在最魔幻的故事里或是最疯癫的诳语中，宇宙深处真正的星辰或许也如提瓦特一般充满了生机，而宇宙本身就如同海洋。
 * 或许宇宙渗入提瓦特的过程从未停止；也许更高的意志为它划定了边界是为了保护这个世界。
 */
export const AlldevouringNarwhal = character(2204)
  .tags("hydro", "monster")
  .health(5)
  .energy(2)
  .skills(ShatteringWaves, StarfallShower, RavagingDevourer, InsatiableAppetite)
  .done();

/**
 * @id 222041
 * @name 无光鲸噬
 * @description
 * 战斗行动：我方出战角色为吞星之鲸时，装备此牌。
 * 吞星之鲸装备此牌后，立刻使用一次迸落星雨。
 * 装备有此牌的吞星之鲸使用迸落星雨舍弃1张手牌后：治疗此角色该手牌元素骰费用的点数。（每回合1次）
 * （牌组中包含吞星之鲸，才能加入牌组）
 */
export const LightlessFeeding = card(222041)
  .costHydro(4)
  .talent(AlldevouringNarwhal)
  .on("enter")
  .useSkill(StarfallShower)
  .done();
