import { card } from "@gi-tcg/core/builder";

/**
 * @id 330001
 * @name 旧时庭园
 * @description
 * 我方有角色已装备「武器」或「圣遗物」时，才能打出：本回合中，我方下次打出「武器」或「圣遗物」装备牌时少花费2个元素骰。
 * （整局游戏只能打出一张「秘传」卡牌；这张牌一定在你的起始手牌中）
 */
export const AncientCourtyard = card(330001)
  .legend()
  // TODO
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
  // TODO
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
  // TODO
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
  // TODO
  .done();

/**
 * @id 330005
 * @name 万家灶火
 * @description
 * 我方抓相当于当前的回合数的牌。（最多抓4张）
 * （整局游戏只能打出一张「秘传」卡牌；这张牌一定在你的起始手牌中）
 */
export const InEveryHouseAStove = card(330005)
  .legend()
  // TODO
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
  // TODO
  .done();
