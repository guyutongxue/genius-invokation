import { DamageType, DiceType, card, combatStatus } from "@gi-tcg/core/builder";

/**
 * @id 323001
 * @name 参量质变仪
 * @description
 * 双方角色使用技能后：如果造成了元素伤害，此牌累积1个「质变进度」。如果此牌已累积3个「质变进度」，则弃置此牌并生成3个不同的基础元素骰。
 */
export const ParametricTransformer = card(323001)
  .costVoid(2)
  .support("item")
  .variable("progress", 0)
  .variable("hasProgress", 0, { visible: false })
  .variable("currentSkill", 0, { visible: false })
  .on("deductDiceSkill")
  .listenToAll()
  .do((c, e) => {
    c.setVariable("currentSkill", e.action.skill.definition.id);
  })
  .on("dealDamage", (c, e) => c.getVariable("currentSkill") &&
    (e.type !== DamageType.Physical && e.type !== DamageType.Piercing))
  .listenToAll()
  .setVariable("hasProgress", 1)
  .on("useSkill", (c, e) => e.action.skill.definition.id === c.getVariable("currentSkill"))
  .listenToAll()
  .do((c) => {
    if (c.getVariable("hasProgress")) {
      c.self.addVariable("progress", 1);
      if (c.getVariable("progress") >= 3) {
        c.generateDice("randomElement", 3);
        c.dispose();
      }
    }
    c.setVariable("currentSkill", 0);
    c.setVariable("hasProgress", 0);
  })
  .done();

/**
 * @id 323002
 * @name 便携营养袋
 * @description
 * 入场时：从牌组中随机抽取1张「料理」事件。
 * 我方打出「料理」事件牌时：从牌组中随机抽取1张「料理」事件牌。（每回合1次）
 */
export const Nre = card(323002)
  .costSame(1)
  .support("item")
  .on("enter")
  .drawCards(1, { withTag: "food" })
  .on("playCard", (c, e) => e.hasCardTag("food"))
  .usagePerRound(1)
  .drawCards(1, { withTag: "food" })
  .done();

/**
 * @id 302303
 * @name 红羽团扇（生效中）
 * @description
 * 本回合中，我方执行的下次「切换角色」行动视为「快速行动」而非「战斗行动」，并且少花费1个元素骰。
 */
export const RedFeatherFanStatus = combatStatus(302303)
  .oneDuration()
  .once("modifyAction", (c, e) => e.action.type === "switchActive" && (!e.isFast() || e.canDeductCost()))
  .setFastAction()
  .deductCost(DiceType.Omni, 1)
  .done();

/**
 * @id 323003
 * @name 红羽团扇
 * @description
 * 我方切换角色后：本回合中，我方执行的下次「切换角色」行动视为「快速行动」而非「战斗行动」，并且少花费1个元素骰。（每回合1次）
 */
export const RedFeatherFan = card(323003)
  .costSame(2)
  .support("item")
  .on("switchActive")
  .usagePerRound(1)
  .combatStatus(RedFeatherFanStatus)
  .done();

/**
 * @id 323004
 * @name 寻宝仙灵
 * @description
 * 我方角色使用技能后：此牌累积1个「寻宝线索」。如果此牌已累积3个「寻宝线索」，则弃置此牌并抓3张牌。
 */
export const TreasureseekingSeelie = card(323004)
  .costSame(1)
  .support("item")
  .variable("clue", 0)
  .on("useSkill")
  .addVariable("clue", 1)
  .do((c) => {
    if (c.getVariable("clue") >= 3) {
      c.drawCards(3);
      c.dispose();
    }
  })
  .done();

/**
 * @id 323005
 * @name 化种匣
 * @description
 * 我方打出原本元素骰费用为1的装备或支援牌时：少花费1个元素骰。（每回合1次）
 * 可用次数：2
 */
export const SeedDispensary = card(323005)
  .support("item")
  .on("deductDiceCard", (c, e) => e.action.card.definition.skillDefinition.requiredCost.length === 1 &&
    ["equipment", "support"].includes(e.action.card.definition.type))
  .deductCost(DiceType.Omni, 1)
  .usage(2)
  .done();

/**
 * @id 323006
 * @name 留念镜
 * @description
 * 我方打出「武器」/「圣遗物」/「场地」/「伙伴」手牌时：如果本场对局中我方曾经打出过所打出牌的同名卡牌，则少花费2个元素骰。（每回合1次）
 * 可用次数：2
 */
export const MementoLens = card(323006)
  .costSame(1)
  .support("item")
  .variable("totalUsage", 2)
  .on("deductDiceCard", (c, e) => {
    if (!e.hasOneOfCardTag("weapon", "artifact", "place", "ally")) {
      return false;
    }
    const played = c.state.globalActionLog.filter(
      (log) => log.who === e.who && 
        log.action.type === "playCard" && 
        log.action.card.definition.id === e.action.card.definition.id);
    return played.length > 0;
  })
  .usagePerRound(1)
  .do((c, e) => {
    e.deductCost(DiceType.Omni, 2);
    c.addVariable("totalUsage", -1);
    if (c.getVariable("totalUsage") <= 0) {
      c.dispose();
    }
  })
  .done();
