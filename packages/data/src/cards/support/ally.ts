import { card } from "@gi-tcg/core/builder";

/**
 * @id 322001
 * @name 派蒙
 * @description
 * 行动阶段开始时：生成2点万能元素。
 * 可用次数：2
 */
const Paimon = card(322001)
  .costSame(3)
  .support("ally")
  // TODO
  .done();

/**
 * @id 322002
 * @name 凯瑟琳
 * @description
 * 我方执行「切换角色」行动时：将此次切换视为「快速行动」而非「战斗行动」。（每回合1次）
 */
const Katheryne = card(322002)
  .costSame(1)
  .support("ally")
  // TODO
  .done();

/**
 * @id 322003
 * @name 蒂玛乌斯
 * @description
 * 入场时附带2个「合成材料」。
 * 结束阶段：补充1个「合成材料」。
 * 打出「圣遗物」手牌时：如可能，则支付等同于「圣遗物」总费用数量的「合成材料」，以免费装备此「圣遗物」。（每回合1次）
 */
const Timaeus = card(322003)
  .costSame(2)
  .support("ally")
  // TODO
  .done();

/**
 * @id 322004
 * @name 瓦格纳
 * @description
 * 入场时附带2个「锻造原胚」。
 * 结束阶段：补充1个「锻造原胚」。
 * 打出「武器」手牌时：如可能，则支付等同于「武器」总费用数量的「锻造原胚」，以免费装备此「武器」。（每回合1次）
 */
const Wagner = card(322004)
  .costSame(2)
  .support("ally")
  // TODO
  .done();

/**
 * @id 322005
 * @name 卯师傅
 * @description
 * 打出「料理」事件牌后：生成1个随机基础元素骰。（每回合1次）
 * 打出「料理」事件牌后：从牌组中随机抽取1张「料理」事件牌。（整场牌局限制1次）
 */
const ChefMao = card(322005)
  .costSame(1)
  .support("ally")
  // TODO
  .done();

/**
 * @id 322006
 * @name 阿圆
 * @description
 * 打出「场地」支援牌时：少花费2个元素骰。（每回合1次）
 */
const Tubby = card(322006)
  .costSame(2)
  .support("ally")
  // TODO
  .done();

/**
 * @id 322007
 * @name 提米
 * @description
 * 每回合自动触发1次：此牌累积1只「鸽子」。如果此牌已累积3只「鸽子」，则弃置此牌，抓1张牌，并生成1点万能元素。
 */
const Timmie = card(322007)
  .support("ally")
  // TODO
  .done();

/**
 * @id 322008
 * @name 立本
 * @description
 * 结束阶段：收集我方未使用的元素骰（每种最多1个）。
 * 行动阶段开始时：如果此牌已收集3个元素骰，则抓2张牌，生成2点万能元素，然后弃置此牌。
 */
const Liben = card(322008)
  .support("ally")
  // TODO
  .done();

/**
 * @id 322009
 * @name 常九爷
 * @description
 * 双方角色使用技能后：如果造成了物理伤害、穿透伤害或引发了元素反应，此牌累积1个「灵感」。如果此牌已累积3个「灵感」，则弃置此牌并抓2张牌。
 */
const ChangTheNinth = card(322009)
  .support("ally")
  // TODO
  .done();

/**
 * @id 322010
 * @name 艾琳
 * @description
 * 我方角色使用本回合使用过的技能时：少花费1个元素骰。（每回合1次）
 */
const Ellin = card(322010)
  .costSame(2)
  .support("ally")
  // TODO
  .done();

/**
 * @id 322011
 * @name 田铁嘴
 * @description
 * 结束阶段：我方一名充能未满的角色获得1点充能。（出战角色优先）
 * 可用次数：2
 */
const IronTongueTian = card(322011)
  .costVoid(2)
  .support("ally")
  // TODO
  .done();

/**
 * @id 322012
 * @name 刘苏
 * @description
 * 我方切换角色后：如果切换到的角色没有充能，则使该角色获得1点充能。（每回合1次）
 * 可用次数：2
 */
const LiuSu = card(322012)
  .costSame(1)
  .support("ally")
  // TODO
  .done();

/**
 * @id 322013
 * @name 花散里
 * @description
 * 召唤物消失时：此牌累积1点「大祓」进度。（最多累积3点）
 * 我方打出「武器」或「圣遗物」装备时：如果「大祓」进度已达到3，则弃置此牌，使打出的卡牌少花费2个元素骰。
 */
const Hanachirusato = card(322013)
  .support("ally")
  // TODO
  .done();

/**
 * @id 322014
 * @name 鲸井小弟
 * @description
 * 行动阶段开始时：生成1点万能元素。然后，如果对方的支援区未满，则将此牌转移到对方的支援区。
 */
const KidKujirai = card(322014)
  .support("ally")
  // TODO
  .done();

/**
 * @id 322015
 * @name 旭东
 * @description
 * 打出「料理」事件牌时：少花费2个元素骰。（每回合1次）
 */
const Xudong = card(322015)
  .costVoid(2)
  .support("ally")
  // TODO
  .done();

/**
 * @id 322016
 * @name 迪娜泽黛
 * @description
 * 打出「伙伴」支援牌时：少花费1个元素骰。（每回合1次）
 * 打出「伙伴」支援牌后：从牌组中随机抽取1张「伙伴」支援牌。（整场牌局限制1次）
 */
const Dunyarzad = card(322016)
  .costSame(1)
  .support("ally")
  // TODO
  .done();

/**
 * @id 322017
 * @name 拉娜
 * @description
 * 我方角色使用「元素战技」后：生成1个我方下一个后台角色类型的元素骰。（每回合1次）
 */
const Rana = card(322017)
  .costSame(2)
  .support("ally")
  // TODO
  .done();

/**
 * @id 322018
 * @name 老章
 * @description
 * 我方打出「武器」手牌时：少花费1个元素骰；我方场上每有一个已装备「武器」的角色，就额外少花费1个元素骰。（每回合1次）
 */
const MasterZhang = card(322018)
  .costSame(1)
  .support("ally")
  // TODO
  .done();

/**
 * @id 322019
 * @name 塞塔蕾
 * @description
 * 我方执行任意行动后，手牌数量为0时：抓1张牌。
 * 可用次数：3
 */
const Setaria = card(322019)
  .costSame(1)
  .support("ally")
  // TODO
  .done();

/**
 * @id 322020
 * @name 弥生七月
 * @description
 * 我方打出「圣遗物」手牌时：少花费1个元素骰；我方场上每有一个已装备「圣遗物」的角色，就额外少花费1个元素骰。（每回合1次）
 */
const YayoiNanatsuki = card(322020)
  .costSame(1)
  .support("ally")
  // TODO
  .done();
