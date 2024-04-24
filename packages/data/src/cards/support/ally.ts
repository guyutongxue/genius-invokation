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

import { CardHandle, DamageType, DiceType, SupportHandle, card, flip } from "@gi-tcg/core/builder";

/**
 * @id 322001
 * @name 派蒙
 * @description
 * 行动阶段开始时：生成2点万能元素。
 * 可用次数：2
 */
export const Paimon = card(322001)
  .costSame(3)
  .support("ally")
  .on("actionPhase")
  .usage(2)
  .generateDice(DiceType.Omni, 2)
  .done();

/**
 * @id 322002
 * @name 凯瑟琳
 * @description
 * 我方执行「切换角色」行动时：将此次切换视为「快速行动」而非「战斗行动」。（每回合1次）
 */
export const Katheryne = card(322002)
  .costSame(1)
  .support("ally")
  .on("beforeFastSwitch")
  .usagePerRound(1)
  .setFastAction()
  .done();

/**
 * @id 322003
 * @name 蒂玛乌斯
 * @description
 * 入场时：此牌附带2个「合成材料」。如果我方牌组中初始包含至少6张「圣遗物」，则从牌组中随机抽取1张「圣遗物」牌。
 * 结束阶段：此牌补充1个「合成材料」。
 * 打出「圣遗物」手牌时：如可能，则支付等同于「圣遗物」总费用数量的「合成材料」，以免费装备此「圣遗物」。（每回合1次）
 */
export const Timaeus = card(322003)
  .costSame(2)
  .support("ally")
  .variable("material", 2)
  .on("enter")
  .do((c) => {
    if (c.player.initialPiles.filter((c) => c.tags.includes("artifact")).length >= 6) {
      c.drawCards(1, { withTag: "artifact" });
    }
  })
  .on("endPhase")
  .addVariable("material", 1)
  .on("deductDiceCard", (c, e) => e.hasCardTag("artifact"))
  .usagePerRound(1)
  .do((c, e) => {
    if (c.getVariable("material") >= e.cost.length) {
      c.addVariable("material", -e.cost.length);
      e.deductCost(DiceType.Omni, e.cost.length);
    }
  })
  .done();

/**
 * @id 322004
 * @name 瓦格纳
 * @description
 * 入场时：此牌附带2个「锻造原胚」。如果我方牌组中初始包含至少3种不同的「武器」，则从牌组中随机抽取1张「武器」牌。
 * 结束阶段：此牌补充1个「锻造原胚」。
 * 打出「武器」手牌时：如可能，则支付等同于「武器」总费用数量的「锻造原胚」，以免费装备此「武器」。（每回合1次）
 */
export const Wagner = card(322004)
  .costSame(2)
  .support("ally")
  .variable("material", 2)
  .on("enter")
  .do((c) => {
    const weaponDefs = c.player.initialPiles.filter((c) => c.tags.includes("weapon")).map((c) => c.id);
    const weaponKinds = new Set(weaponDefs).size;
    if (weaponKinds >= 3) {
      c.drawCards(1, { withTag: "weapon" });
    }
  })
  .on("endPhase")
  .addVariable("material", 1)
  .on("deductDiceCard", (c, e) => e.hasCardTag("weapon"))
  .usagePerRound(1)
  .do((c, e) => {
    if (c.getVariable("material") >= e.cost.length) {
      c.addVariable("material", -e.cost.length);
      e.deductCost(DiceType.Omni, e.cost.length);
    }
  })
  .done();

/**
 * @id 322005
 * @name 卯师傅
 * @description
 * 打出「料理」事件牌后：生成1个随机基础元素骰。（每回合1次）
 * 打出「料理」事件牌后：从牌组中随机抽取1张「料理」事件牌。（整场牌局限制1次）
 */
export const ChefMao = card(322005)
  .costSame(1)
  .support("ally")
  .on("playCard", (c, e) => e.hasCardTag("food"))
  .usagePerRound(1)
  .generateDice("randomElement", 1)
  .on("playCard", (c, e) => e.hasCardTag("food"))
  .usage(1, { autoDispose: false })
  .drawCards(1, { withTag: "food" })
  .done();

/**
 * @id 322006
 * @name 阿圆
 * @description
 * 打出「场地」支援牌时：少花费2个元素骰。（每回合1次）
 */
export const Tubby = card(322006)
  .costSame(2)
  .support("ally")
  .on("deductDiceCard", (c, e) => e.hasCardTag("place"))
  .deductCost(DiceType.Omni, 2)
  .done();

/**
 * @id 322007
 * @name 提米
 * @description
 * 每回合自动触发1次：此牌累积1只「鸽子」。如果此牌已累积3只「鸽子」，则弃置此牌，抓1张牌，并生成1点万能元素。
 */
export const Timmie = card(322007)
  .support("ally")
  .variable("pigeon", 1)
  .on("actionPhase")
  .do((c) => {
    c.addVariable("pigeon", 1);
    if (c.getVariable("pigeon") === 3) {
      c.drawCards(1);
      c.generateDice(DiceType.Omni, 1);
      c.dispose();
    }
  })
  .done();

/**
 * @id 322008
 * @name 立本
 * @description
 * 结束阶段：收集我方未使用的元素骰（每种最多1个）。
 * 行动阶段开始时：如果此牌已收集3个元素骰，则抓2张牌，生成2点万能元素，然后弃置此牌。
 */
export const Liben = card(322008)
  .support("ally")
  .variable("collected", 0)
  .on("endPhase")
  .do((c) => {
    const absorbed = c.absorbDice("diff", 3 - c.getVariable("collected"));
    c.addVariable("collected", absorbed.length);
  })
  .on("actionPhase")
  .do((c) => {
    if (c.getVariable("collected") >= 3) {
      c.drawCards(2);
      c.generateDice(DiceType.Omni, 2);
      c.dispose();
    }
  })
  .done();

/**
 * @id 322009
 * @name 常九爷
 * @description
 * 双方角色使用技能后：如果造成了物理伤害、穿透伤害或引发了元素反应，此牌累积1个「灵感」。如果此牌已累积3个「灵感」，则弃置此牌并抓2张牌。
 */
export const ChangTheNinth = card(322009)
  .support("ally")
  .variable("inspiration", 0)
  .variable("hasInspiration", 0, { visible: false })
  .variable("currentSkill", 0, { visible: false })
  .on("modifyAction")
  .listenToAll()
  .do((c, e) => {
    if (e.action.type === "useSkill") {
      c.setVariable("currentSkill", e.action.skill.definition.id);
    }
  })
  .on("dealDamage", (c, e) => c.getVariable("currentSkill") &&
    (e.type === DamageType.Physical || e.type === DamageType.Piercing))
  .listenToAll()
  .setVariable("hasInspiration", 1)
  .on("reaction", (c, e) => c.getVariable("currentSkill"))
  .listenToAll()
  .setVariable("hasInspiration", 1)
  .on("useSkill", (c, e) => e.action.skill.definition.id === c.getVariable("currentSkill"))
  .listenToAll()
  .do((c) => {
    if (c.getVariable("hasInspiration")) {
      c.addVariable("inspiration", 1);
      if (c.getVariable("inspiration") >= 3) {
        c.drawCards(2);
        c.dispose();
      }
    }
    c.setVariable("currentSkill", 0);
    c.setVariable("hasInspiration", 0);
  })
  .done();

/**
 * @id 322010
 * @name 艾琳
 * @description
 * 我方角色使用本回合使用过的技能时：少花费1个元素骰。（每回合1次）
 */
export const Ellin = card(322010)
  .costSame(2)
  .support("ally")
  .on("deductDiceSkill", (c, e) => {
    const used = c.state.globalUseSkillLog.find(
      (log) =>
        log.roundNumber === c.state.roundNumber &&
        log.who === e.who &&
        log.skill.definition.id === e.action.skill.definition.id);
    return !!used;
  })
  .usagePerRound(1)
  .deductCost(DiceType.Omni, 1)
  .done();

/**
 * @id 322011
 * @name 田铁嘴
 * @description
 * 结束阶段：我方一名充能未满的角色获得1点充能。（出战角色优先）
 * 可用次数：2
 */
export const IronTongueTian = card(322011)
  .costVoid(2)
  .support("ally")
  .on("endPhase")
  .gainEnergy(1, "my characters with energy < maxEnergy limit 1")
  .done();

/**
 * @id 322012
 * @name 刘苏
 * @description
 * 我方切换角色后：如果切换到的角色没有充能，则使该角色获得1点充能。（每回合1次）
 * 可用次数：2
 */
export const LiuSu = card(322012)
  .costSame(1)
  .support("ally")
  .on("switchActive", (c, e) => c.of(e.switchInfo.to).energy === 0)
  .usage(2)
  .gainEnergy(1, "@event.switchTo")
  .done();

/**
 * @id 322013
 * @name 花散里
 * @description
 * 召唤物消失时：此牌累积1点「大祓」进度。（最多累积3点）
 * 我方打出「武器」或「圣遗物」装备时：如果「大祓」进度已达到3，则弃置此牌，使打出的卡牌少花费2个元素骰。
 */
export const Hanachirusato = card(322013)
  .support("ally")
  .variable("progress", 0)
  .on("dispose", (c, e) => e.entity.definition.type === "summon")
  .listenToAll()
  .addVariableWithMax("progress", 1, 3)
  .on("deductDiceCard", (c, e) => e.hasOneOfCardTag("weapon", "artifact") && c.getVariable("progress") >= 3)
  .deductCost(DiceType.Omni, 2)
  .dispose()
  .done();

/**
 * @id 322014
 * @name 鲸井小弟
 * @description
 * 行动阶段开始时：生成1点万能元素。然后，如果对方的支援区未满，则将此牌转移到对方的支援区。
 */
export const KidKujirai = card(322014)
  .support("ally")
  .on("actionPhase")
  .do((c) => {
    c.generateDice(DiceType.Omni, 1);
    if (c.oppPlayer.supports.length < c.state.config.maxSupports) {
      c.transferEntity(c.self.state, {
        type: "supports",
        who: flip(c.self.who)
      });
    }
  })
  .done();

/**
 * @id 322015
 * @name 旭东
 * @description
 * 打出「料理」事件牌时：少花费2个元素骰。（每回合1次）
 */
export const Xudong = card(322015)
  .costVoid(2)
  .support("ally")
  .on("deductDiceCard", (c, e) => e.hasCardTag("food"))
  .usagePerRound(1)
  .deductCost(DiceType.Omni, 2)
  .done();

/**
 * @id 322016
 * @name 迪娜泽黛
 * @description
 * 打出「伙伴」支援牌时：少花费1个元素骰。（每回合1次）
 * 打出「伙伴」支援牌后：从牌组中随机抽取1张「伙伴」支援牌。（整场牌局限制1次）
 */
export const Dunyarzad = card(322016)
  .costSame(1)
  .support("ally")
  .on("deductDiceCard", (c, e) => e.hasCardTag("ally"))
  .usagePerRound(1)
  .deductCost(DiceType.Omni, 1)
  .on("playCard", (c, e) => e.hasCardTag("ally"))
  .usage(1, { autoDispose: false, visible: false })
  .drawCards(1, { withTag: "ally" })
  .done();

/**
 * @id 322017
 * @name 拉娜
 * @description
 * 我方角色使用「元素战技」后：生成1个我方下一个后台角色类型的元素骰。（每回合1次）
 */
export const Rana = card(322017)
  .costSame(2)
  .support("ally")
  .on("useSkill", (c, e) => e.isSkillType("elemental"))
  .usagePerRound(1)
  .do((c) => {
    const next = c.$("my next")!;
    c.generateDice(next.element(), 1);
  })
  .done();

/**
 * @id 322018
 * @name 老章
 * @description
 * 我方打出「武器」手牌时：少花费1个元素骰；我方场上每有一个已装备「武器」的角色，就额外少花费1个元素骰。（每回合1次）
 */
export const MasterZhang = card(322018)
  .costSame(1)
  .support("ally")
  .on("deductDiceCard", (c, e) => e.hasCardTag("weapon"))
  .usagePerRound(1)
  .do((c, e) => {
    const weaponedCh = c.$$("my characters has equipment with tag (weapon)").length;
    e.deductCost(DiceType.Omni, 1 + weaponedCh);
  })
  .done();

/**
 * @id 322019
 * @name 塞塔蕾
 * @description
 * 我方执行任意行动后，手牌数量为0时：抓1张牌。
 * 可用次数：3
 */
export const Setaria = card(322019)
  .costSame(1)
  .support("ally")
  .on("action")
  .usage(3)
  .do((c) => {
    if (c.player.hands.length === 0) {
      c.drawCards(1);
    }
  })
  .done();

/**
 * @id 322020
 * @name 弥生七月
 * @description
 * 我方打出「圣遗物」手牌时：少花费1个元素骰；如果我方场上已有2个已装备「圣遗物」的角色，就额外少花费1个元素骰。（每回合1次）
 * @outdated
 * 我方打出「圣遗物」手牌时：少花费1个元素骰；我方场上每有一个已装备「圣遗物」的角色，就额外少花费1个元素骰。（每回合1次）
 */
export const YayoiNanatsuki = card(322020)
  .costSame(1)
  .support("ally")
  .on("deductDiceCard", (c, e) => e.hasCardTag("artifact"))
  .usagePerRound(1)
  .do((c, e) => {
    const artifactedCh = c.$$("my characters has equipment with tag (artifact)").length;
    e.deductCost(DiceType.Omni, 1 + artifactedCh);
  })
  .done();

/**
 * @id 322021
 * @name 玛梅赫
 * @description
 * 我方打出「玛梅赫」以外的「料理」/「场地」/「伙伴」/「道具」行动牌后：随机生成1张「玛梅赫」以外的「料理」/「场地」/「伙伴」/「道具」行动牌，将其加入手牌。（每回合1次）
 * 可用次数：3
 */
export const Mamere: SupportHandle = card(322021)
  .support("ally")
  .on("playCard", (c, e) => 
    e.action.card.definition.id !== Mamere &&
    e.hasOneOfCardTag("food", "place", "ally", "item")
  )
  .usage(3)
  .do((c) => {
    const tags = ["food", "place", "ally", "item"] as const;
    const candidates = [...c.state.data.cards.values()].filter((c) => c.id !== Mamere && tags.some((tag) => c.tags.includes(tag)));
    const card = c.random(...candidates);
    c.createHandCard(card.id as CardHandle);
  })
  .on("playCard", (c, e) => 
    e.action.card.definition.id !== Mamere &&
    e.hasOneOfCardTag("food", "place", "ally", "item")
  )
  .usagePerRound(1)
  .done();

/**
 * @id 322022
 * @name 婕德
 * @description
 * 此牌会记录本场对局中我方支援区弃置卡牌的数量，称为「阅历」。（最多6点）
 * 我方角色使用「元素爆发」后：如果「阅历」至少为6，则弃置此牌，对我方出战角色附属沙与梦。
 * @outdated
 * 此牌会记录本场对局中我方支援区弃置卡牌的数量，称为「阅历」。（最多6点）
 * 我方角色使用「元素爆发」后：如果「阅历」至少为5，则弃置此牌，生成「阅历」-2数量的万能元素。
 */
export const Jeht = card(322022)
  .costVoid(2)
  .support("ally")
  .variable("experience", 0)
  .on("enter")
  .do((c) => {
    c.setVariable("experience", c.player.disposedSupportCount);
  })
  .on("dispose", (c, e) => e.entity.definition.type === "support")
  .addVariableWithMax("experience", 1, 6)
  .on("useSkill", (c, e) => e.isSkillType("burst"))
  .do((c) => {
    const exp = c.getVariable("experience");
    if (exp >= 5) {
      c.generateDice(DiceType.Omni, exp - 2);
      c.dispose();
    }
  })
  .done();

/**
 * @id 322023
 * @name 西尔弗和迈勒斯
 * @description
 * 此牌会记录本场对局中敌方角色受到过的元素伤害种类数，称为「侍从的周到」。（最多4点）
 * 结束阶段：如果「侍从的周到」至少为3，则弃置此牌，然后抓「侍从的周到」点数的牌。
 */
export const SilverAndMelus = card(322023)
  .costSame(1)
  .support("ally")
  .variable("count", 0)
  .variable("bitset", 0, { visible: false })
  .on("damaged", (c, e) => !c.of(e.target).isMine() && 
    e.type !== DamageType.Physical && 
    e.type !== DamageType.Piercing)
  .listenToAll()
  .do((c, e) => {
    const bit = 1 << e.type;
    const current = c.getVariable("bitset");
    if ((current & bit) === 0) {
      c.setVariable("bitset", current | bit);
      c.addVariableWithMax("count", 1, 4);
    }
  })
  .on("endPhase")
  .do((c) => {
    const count = c.getVariable("count");
    if (count >= 3) {
      c.drawCards(count);
      c.dispose();
    }
  })
  .done();

/**
 * @id 322024
 * @name 太郎丸
 * @description
 * 入场时：生成4张太郎丸的存款，均匀地置入我方牌库中。
 * 我方打出2张太郎丸的存款后：弃置此牌，召唤愤怒的太郎丸。
 */
export const Taroumaru = card(322024)
  .costVoid(2)
  .support("ally")
  // TODO
  .done();

/**
 * @id 322025
 * @name 白手套和渔夫
 * @description
 * 结束阶段：生成1张「清洁工作」，随机将其置入我方牌库顶部5张牌之中。如果此牌的可用次数仅剩余1，则抓1张牌。
 * 可用次数：2
 */
export const TheWhiteGloveAndTheFisherman = card(322025)
  .support("ally")
  // TODO
  .done();
