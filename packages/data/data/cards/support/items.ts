import { createCard } from '@gi-tcg';

/**
 * **便携营养袋**
 * 入场时：从牌组中随机抽取1张「料理」事件。
 * 我方打出「料理」事件牌时：从牌组中随机抽取1张「料理」事件。（每回合1次）
 */
const Nre = createCard(323002)
  .setType("support")
  .addTags("item")
  .costVoid(2)
  .drawCards(1, false, "food")
  .buildToSupport()
  .withUsagePerRound(1)
  .on("playCard", (c) => {
    if (c.info.tags.includes("food")) {
      c.drawCards(1, false, "food");
    } else {
      return false;
    }
  })
  .build();

/**
 * **参量质变仪**
 * 双方角色使用技能后：如果造成了元素伤害，此牌累积1个「质变进度」。
 * 当此牌已累积3个「质变进度」时，弃置此牌：生成3个不同的基础元素骰子。
 * 注意：使用常九爷类似的方法来处理（有没有更好的办法？）
 */
const ParametricTransformer = createCard(323001)
  .setType("support")
  .addTags("item")
  .costVoid(2)
  .buildToSupport()
  // TODO
  .build();

/**
 * **红羽团扇**
 * 我方切换角色后：本回合中，我方执行的下次「切换角色」行动视为「快速行动」而非「战斗行动」，并且少花费1个元素骰。（每回合1次）
 */
const RedFeatherFan = createCard(323003)
  .setType("support")
  .addTags("item")
  .costSame(2)
  .buildToSupport()
  .withUsagePerRound(1)
  .on("requestFastSwitchActive", () => true)
  .on("beforeUseDice", (c) => {
    if (c.switchActiveCtx) {
      c.deductCost(1);
    }
    return false; // deduct usage at requestFast
  })
  .build();

/**
 * **寻宝仙灵**
 * 我方角色使用技能后：此牌累积1个「寻宝线索」。
 * 当此牌已累积3个「寻宝线索」时，弃置此牌：抓3张牌。
 */
const TreasureseekingSeelie = createCard(323004)
  .setType("support")
  .addTags("item")
  .costSame(1)
  .buildToSupport()
  .do({
    onUseSkill(c) {
      this.clue++;
      if (this.clue === 3) {
        c.drawCards(3);
        c.dispose();
      }
    }
  }, { clue: 0 })
  .build();
