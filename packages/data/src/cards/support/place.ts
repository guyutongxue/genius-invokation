import { card } from "@gi-tcg/core/builder";

/**
 * @id 321012
 * @name 镇守之森
 * @description
 * 行动阶段开始时：如果我方不是「先手牌手」，则生成1个出战角色类型的元素骰。
 * 可用次数：3
 */
const ChinjuForest = card(321012)
  .costSame(1)
  .support("place")
  // TODO
  .done();

/**
 * @id 321004
 * @name 晨曦酒庄
 * @description
 * 我方执行「切换角色」行动时：少花费1个元素骰。（每回合1次）
 */
const DawnWinery = card(321004)
  .costSame(2)
  .support("place")
  // TODO
  .done();

/**
 * @id 321006
 * @name 西风大教堂
 * @description
 * 结束阶段：治疗我方「出战角色」2点。
 * 可用次数：2
 */
const FavoniusCathedral = card(321006)
  .costSame(2)
  .support("place")
  // TODO
  .done();

/**
 * @id 321014
 * @name 化城郭
 * @description
 * 我方选择行动前，元素骰数量为0时：生成1个万能元素。（每回合1次）
 * 可用次数：3
 */
const GandharvaVille = card(321014)
  .costSame(1)
  .support("place")
  // TODO
  .done();

/**
 * @id 321013
 * @name 黄金屋
 * @description
 * 我方打出原本元素骰费用至少为3的「武器」或「圣遗物」手牌时：少花费1个元素骰。（每回合1次）
 * 可用次数：2
 */
const GoldenHouse = card(321013)
  .support("place")
  // TODO
  .done();

/**
 * @id 321008
 * @name 鸣神大社
 * @description
 * 每回合自动触发1次：生成1个随机的基础元素骰。
 * 可用次数：3
 */
const GrandNarukamiShrine = card(321008)
  .costSame(2)
  .support("place")
  // TODO
  .done();

/**
 * @id 321003
 * @name 群玉阁
 * @description
 * 投掷阶段：2个元素骰初始总是投出我方出战角色类型的元素。
 */
const JadeChamber = card(321003)
  .support("place")
  // TODO
  .done();

/**
 * @id 321002
 * @name 骑士团图书馆
 * @description
 * 入场时：选择任意元素骰重投。
 * 投掷阶段：获得额外一次重投机会。
 */
const KnightsOfFavoniusLibrary = card(321002)
  .costSame(1)
  .support("place")
  // TODO
  .done();

/**
 * @id 321001
 * @name 璃月港口
 * @description
 * 结束阶段：抓2张牌。
 * 可用次数：2
 */
const LiyueHarborWharf = card(321001)
  .costSame(2)
  .support("place")
  // TODO
  .done();

/**
 * @id 321009
 * @name 珊瑚宫
 * @description
 * 结束阶段：治疗所有我方角色1点。
 * 可用次数：2
 */
const SangonomiyaShrine = card(321009)
  .costSame(2)
  .support("place")
  // TODO
  .done();

/**
 * @id 321015
 * @name 风龙废墟
 * @description
 * 入场时：从牌组中随机抽取一张「天赋」牌。
 * 我方打出「天赋」牌，或我方角色使用原本元素骰消耗至少为4的技能时：少花费1个元素骰。（每回合1次）
 * 可用次数：3
 */
const StormterrorsLair = card(321015)
  .costSame(2)
  .support("place")
  // TODO
  .done();

/**
 * @id 321010
 * @name 须弥城
 * @description
 * 我方角色使用技能或装备「天赋」时：如果我方元素骰数量不多于手牌数量，则少花费1个元素骰。（每回合1次）
 */
const SumeruCity = card(321010)
  .costSame(2)
  .support("place")
  // TODO
  .done();

/**
 * @id 321007
 * @name 天守阁
 * @description
 * 行动阶段开始时：如果我方的元素骰包含5种不同的元素，则生成1个万能元素。
 */
const Tenshukaku = card(321007)
  .costSame(2)
  .support("place")
  // TODO
  .done();

/**
 * @id 321011
 * @name 桓那兰那
 * @description
 * 结束阶段：收集最多2个未使用的元素骰。
 * 行动阶段开始时：拿回此牌所收集的元素骰。
 */
const Vanarana = card(321011)
  .support("place")
  .variable("count", 0)
  .variable("d1", 0)
  .variable("d2", 0)
  .on("endPhase")
  .do((c) => {
    const absorbed = c.absorbDice("seq", 2);
    c.setVariable("count", absorbed.length);
    c.setVariable("d1", absorbed[0] ?? 0);
    c.setVariable("d2", absorbed[1] ?? 0);
  })
  .on("actionPhase")
  .do((c) => {
    const { state } = c.caller();
    if (state.variables.count === 2) {
      c.generateDice(state.variables.d1, 1);
      c.generateDice(state.variables.d2, 1);
    } else if (state.variables.count === 1) {
      c.generateDice(state.variables.d1, 1);
    }
  })
  .setVariable("count", 0)
  .done();

/**
 * @id 321005
 * @name 望舒客栈
 * @description
 * 结束阶段：治疗受伤最多的我方后台角色2点。
 * 可用次数：2
 */
const WangshuInn = card(321005)
  .costSame(2)
  .support("place")
  .on("endPhase")
  .usage(2)
  .heal(2, "my standby characters order by (maxHealth - health) limit 1")
  .done();
