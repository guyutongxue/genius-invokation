import { DiceType, Target, createCard } from '@gi-tcg';

/**
 * **镇守之森**
 * 行动阶段开始时：如果我方不是「先手牌手」，则生成1个出战角色类型的元素骰。
 * 可用次数：3
 */
const ChinjuForest = createCard(321012)
  .setType("support")
  .addTags("place")
  .costSame(1)
  .buildToSupport()
  // TODO
  .build();

/**
 * **晨曦酒庄**
 * 我方执行「切换角色」行动时：少花费1个元素骰。（每回合1次）
 */
const DawnWinery = createCard(321004)
  .setType("support")
  .addTags("place")
  .costSame(2)
  .buildToSupport()
  .withUsagePerRound(1)
  .on("beforeUseDice", (c) => {
    if (c.switchActiveCtx) {
      c.deductCost(DiceType.Void);
    } else {
      return false;
    }
  })
  .build();

/**
 * **西风大教堂**
 * 结束阶段：治疗我方出战角色2点。
 * 可用次数：2
 */
const FavoniusCathedral = createCard(321006)
  .setType("support")
  .addTags("place")
  .costSame(2)
  .buildToSupport()
  .withUsage(2)
  .on("endPhase", (c) => {
    c.heal(2, Target.myActive());
  })
  .build();

/**
 * **鸣神大社**
 * 每回合自动触发1次：生成1个随机的基础元素骰。
 * 可用次数：3
 */
const GrandNarukamiShrine = createCard(321008)
  .setType("support")
  .addTags("place")
  .costSame(2)
  .buildToSupport()
  .withUsage(2)
  .on("enter", (c) => {
    c.generateRandomElementDice();
  })
  .on("actionPhase", (c) => {
    c.generateRandomElementDice();
  })
  .build();

/**
 * **群玉阁**
 * 投掷阶段：2个元素骰初始总是投出我方出战角色类型的元素。
 */
const JadeChamber = createCard(321003)
  .setType("support")
  .addTags("place")
  .costSame(1)
  .buildToSupport()
  .on("rollPhase", (c) => {
    const d = c.activeCharacterElement;
    c.fixDice(d, d);
  })
  .build();

/**
 * **骑士团图书馆**
 * 入场时：选择任意元素骰重投。
 * 投掷阶段：获得额外一次重投机会。
 */
const KnightsOfFavoniusLibrary = createCard(321002)
  .setType("support")
  .addTags("place")
  .costSame(1)
  .buildToSupport()
  .on("enter", (c) => c.rollDice(1))
  .on("rollPhase", (c) => c.addRerollCount(1))
  .build();

/**
 * **璃月港口**
 * 结束阶段：抓2张牌。
 * 可用次数：2
 */
const LiyueHarborWharf = createCard(321001)
  .setType("support")
  .addTags("place")
  .costSame(2)
  .buildToSupport()
  .withUsage(2)
  .on("endPhase", (c) => c.drawCards(2))
  .build();

/**
 * **珊瑚宫**
 * 结束阶段：治疗所有我方角色1点。
 * 可用次数：2
 */
const SangonomiyaShrine = createCard(321009)
  .setType("support")
  .addTags("place")
  .costSame(2)
  .buildToSupport()
  .withUsage(2)
  .on("endPhase", (c) => c.heal(1, Target.myAll()))
  .build();

/**
 * **须弥城**
 * 我方角色使用技能或装备「天赋」时：如果我方元素骰数量不多于手牌数量，则少花费1个元素骰。（每回合1次）
 */
const SumeruCity = createCard(321010)
  .setType("support")
  .addTags("place")
  .costSame(2)
  .buildToSupport()
  // TODO
  .build();

/**
 * **天守阁**
 * 行动阶段开始时：如果我方的元素骰包含5种不同的元素，则生成1个万能元素。
 */
const Tenshukaku = createCard(321007)
  .setType("support")
  .addTags("place")
  .costSame(2)
  .buildToSupport()
  .on("actionPhase", (c) => {
    const diceTypeCount = new Set(c.getDice()).size;
    if (diceTypeCount >= 5) {
      c.generateDice(DiceType.Omni);
    }
  })
  .build();

/**
 * **桓那兰那**
 * 结束阶段：收集最多2个未使用的元素骰。
 * 行动阶段开始时：拿回此牌所收集的元素骰。
 */
const Vanarana = createCard(321011)
  .setType("support")
  .addTags("place")
  .buildToSupport()
  .do({
    onEndPhase(c) {
      const a = c.getDice().shift();
      const b = c.getDice().shift();
      a && this.collected.push(a);
      b && this.collected.push(b);
    },
    onActionPhase(c) {
      c.generateDice(...this.collected);
      this.collected = [];
    }
  }, { collected: [] as DiceType[] })
  .build();

/**
 * **望舒客栈**
 * 结束阶段：治疗受伤最多的我方后台角色2点。
 * 可用次数：2
 */
const WangshuInn = createCard(321005)
  .setType("support")
  .addTags("place")
  .costSame(2)
  .buildToSupport()
  // TODO
  .build();
