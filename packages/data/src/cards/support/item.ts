import { card } from "@gi-tcg/core/builder";

/**
 * @id 323001
 * @name 参量质变仪
 * @description
 * 双方角色使用技能后：如果造成了元素伤害，此牌累积1个「质变进度」。如果此牌已累积3个「质变进度」，则弃置此牌并生成3个不同的基础元素骰。
 */
const ParametricTransformer = card(323001)
  .costVoid(2)
  .support("item")
  // TODO
  .done();

/**
 * @id 323002
 * @name 便携营养袋
 * @description
 * 入场时：从牌组中随机抽取1张「料理」事件。
 * 我方打出「料理」事件牌时：从牌组中随机抽取1张「料理」事件牌。（每回合1次）
 */
const Nre = card(323002)
  .costSame(1)
  .support("item")
  // TODO
  .done();

/**
 * @id 323003
 * @name 红羽团扇
 * @description
 * 我方切换角色后：本回合中，我方执行的下次「切换角色」行动视为「快速行动」而非「战斗行动」，并且少花费1个元素骰。（每回合1次）
 */
const RedFeatherFan = card(323003)
  .costSame(2)
  .support("item")
  // TODO
  .done();

/**
 * @id 323004
 * @name 寻宝仙灵
 * @description
 * 我方角色使用技能后：此牌累积1个「寻宝线索」。如果此牌已累积3个「寻宝线索」，则弃置此牌并抓3张牌。
 */
const TreasureseekingSeelie = card(323004)
  .costSame(1)
  .support("item")
  // TODO
  .done();
