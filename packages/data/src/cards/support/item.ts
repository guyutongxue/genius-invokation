import { DamageType, DiceType, canSwitchDeductCost1, card } from "@gi-tcg/core/builder";

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
  .on("beforeUseDice")
  .listenToAll()
  .do((c) => {
    if (c.currentAction.type === "useSkill") {
      c.setVariable("currentSkill", c.currentAction.skill.definition.id);
    }
  })
  .on("dealDamage", (c, e) => c.self.getVariable("currentSkill") &&
    (e.type !== DamageType.Physical && e.type !== DamageType.Piercing))
  .listenToAll()
  .setVariable("hasProgress", 1)
  .on("skill", (c, e) => e.definition.id === c.self.getVariable("currentSkill"))
  .listenToAll()
  .do((c) => {
    if (c.self.getVariable("hasProgress")) {
      c.self.addVariable("progress", 1);
      if (c.self.getVariable("progress") >= 3) {
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
  .on("playCard", (c, e) => e.card.definition.tags.includes("food"))
  .usagePerRound(1)
  .drawCards(1, { withTag: "food" })
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
  .on("beforeUseDice", (c) => c.currentAction.type === "switchActive" &&
    (!c.currentFast || canSwitchDeductCost1(c)))
  .setFastAction()
  .deductCost(DiceType.Omni, 1)
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
  .on("skill")
  .addVariable("clue", 1)
  .do((c) => {
    if (c.self.getVariable("clue") >= 3) {
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
  .on("beforeUseDice", (c) => c.currentAction.type === "playCard" &&
    c.currentAction.card.definition.skillDefinition.requiredCost.length === 1 &&
    ["equipment", "support"].includes(c.currentAction.card.definition.type))
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
  .on("beforeUseDice", (c) => {
    const { currentAction, currentCost } = c;
    if (currentAction.type !== "playCard") {
      return false;
    }
    if (currentCost.length === 0) {
      return false;
    }
    const tags = ["weapon", "artifact", "place", "ally"] as const;
    if (tags.every((tag) => !currentAction.card.definition.tags.includes(tag))) {
      return false;
    }
    const played = c.state.globalActionLog.filter(
      (e) => e.who === c.eventWho && 
        e.action.type === "playCard" && 
        e.action.card.definition.id === currentAction.card.definition.id);
    return played.length > 0;
  })
  .usagePerRound(1)
  .do((c) => {
    c.deductCost(DiceType.Omni, 2);
    c.addVariable("totalUsage", -1);
    if (c.self.getVariable("totalUsage") <= 0) {
      c.dispose();
    }
  })
  .done();
