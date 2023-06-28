import { createCard } from '@gi-tcg';

/**
 * **镇守之森**
 * 行动阶段开始时：如果我方不是「先手牌手」，则生成1个出战角色类型的元素骰。
 * 可用次数：3
 */
export const ChinjuForest = createCard(321012)
  .setType("support")
  .addTags("place")
  .costSame(1)
  // TODO
  .build();

/**
 * **晨曦酒庄**
 * 我方执行「切换角色」行动时：少花费1个元素骰。（每回合1次）
 */
export const DawnWinery = createCard(321004)
  .setType("support")
  .addTags("place")
  .costSame(2)
  // TODO
  .build();

/**
 * **西风大教堂**
 * 结束阶段：治疗我方出战角色2点。
 * 可用次数：2
 */
export const FavoniusCathedral = createCard(321006)
  .setType("support")
  .addTags("place")
  .costSame(2)
  // TODO
  .build();

/**
 * **鸣神大社**
 * 每回合自动触发1次：生成1个随机的基础元素骰。
 * 可用次数：3
 */
export const GrandNarukamiShrine = createCard(321008)
  .setType("support")
  .addTags("place")
  .costSame(2)
  // TODO
  .build();

/**
 * **群玉阁**
 * 投掷阶段：2个元素骰初始总是投出我方出战角色类型的元素。
 */
export const JadeChamber = createCard(321003)
  .setType("support")
  .addTags("place")
  .costSame(1)
  // TODO
  .build();

/**
 * **骑士团图书馆**
 * 入场时：选择任意元素骰重投。
 * 投掷阶段：获得额外一次重投机会。
 */
export const KnightsOfFavoniusLibrary = createCard(321002)
  .setType("support")
  .addTags("place")
  .costSame(1)
  // TODO
  .build();

/**
 * **璃月港口**
 * 结束阶段：抓2张牌。
 * 可用次数：2
 */
export const LiyueHarborWharf = createCard(321001)
  .setType("support")
  .addTags("place")
  .costSame(2)
  // TODO
  .build();

/**
 * **珊瑚宫**
 * 结束阶段：治疗所有我方角色1点。
 * 可用次数：2
 */
export const SangonomiyaShrine = createCard(321009)
  .setType("support")
  .addTags("place")
  .costSame(2)
  // TODO
  .build();

/**
 * **须弥城**
 * 我方角色使用技能或装备「天赋」时：如果我方元素骰数量不多于手牌数量，则少花费1个元素骰。（每回合1次）
 */
export const SumeruCity = createCard(321010)
  .setType("support")
  .addTags("place")
  .costSame(2)
  // TODO
  .build();

/**
 * **天守阁**
 * 行动阶段开始时：如果我方的元素骰包含5种不同的元素，则生成1个万能元素。
 */
export const Tenshukaku = createCard(321007)
  .setType("support")
  .addTags("place")
  .costSame(2)
  // TODO
  .build();

/**
 * **桓那兰那**
 * 结束阶段：收集最多2个未使用的元素骰。
 * 行动阶段开始时：拿回此牌所收集的元素骰。
 */
export const Vanarana = createCard(321011)
  .setType("support")
  .addTags("place")
  
  // TODO
  .build();

/**
 * **望舒客栈**
 * 结束阶段：治疗受伤最多的我方后台角色2点。
 * 可用次数：2
 */
export const WangshuInn = createCard(321005)
  .setType("support")
  .addTags("place")
  .costSame(2)
  // TODO
  .build();
