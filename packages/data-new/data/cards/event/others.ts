import { createCard } from '@gi-tcg';

/**
 * **深渊的呼唤**
 * 召唤一个随机「丘丘人」召唤物！
 * （牌组包含至少2个「魔物」角色，才能加入牌组）
 */
export const AbyssalSummons = createCard(332015)
  .setType("event")
  .addTags()
  .costSame(2)
  // TODO
  .build();

/**
 * **神宝迁宫祝词**
 * 将一个装备在我方角色的「圣遗物」装备牌，转移给另一个我方角色。
 */
export const BlessingOfTheDivineRelicsInstallation = createCard(332011)
  .setType("event")
  .addTags()
  
  // TODO
  .build();

/**
 * **白垩之术**
 * 从最多2个我方后台角色身上，转移1点充能到我方出战角色。
 */
export const CalxsArts = createCard(332009)
  .setType("event")
  .addTags()
  .costSame(1)
  // TODO
  .build();

/**
 * **换班时间**
 * 我方下次执行「切换角色」行动时：少花费1个元素骰。
 */
export const ChangingShifts = createCard(332002)
  .setType("event")
  .addTags()
  
  // TODO
  .build();

/**
 * **元素共鸣：坚定之岩**
 * 本回合中，我方角色下一次造成岩元素伤害后：如果我方存在提供「护盾」的出战状态，则为一个此类出战状态补充3点「护盾」。
 * （牌组包含至少2个岩元素角色，才能加入牌组）
 */
export const ElementalResonanceEnduringRock = createCard(331602)
  .setType("event")
  .addTags("resonance")
  .costGeo(1)
  // TODO
  .build();

/**
 * **元素共鸣：热诚之火**
 * 本回合中，我方当前出战角色下一次引发火元素相关反应时，造成的伤害+3。
 * （牌组包含至少2个火元素角色，才能加入牌组）
 */
export const ElementalResonanceFerventFlames = createCard(331302)
  .setType("event")
  .addTags("resonance")
  .costPyro(1)
  // TODO
  .build();

/**
 * **元素共鸣：强能之雷**
 * 我方一名充能未满的角色获得1点充能。（出战角色优先）
 * （牌组包含至少2个雷元素角色，才能加入牌组）
 */
export const ElementalResonanceHighVoltage = createCard(331402)
  .setType("event")
  .addTags("resonance")
  .costElectro(1)
  // TODO
  .build();

/**
 * **元素共鸣：迅捷之风**
 * 切换到目标角色，并生成1点万能元素。
 * （牌组包含至少2个风元素角色，才能加入牌组）
 */
export const ElementalResonanceImpetuousWinds = createCard(331502)
  .setType("event")
  .addTags("resonance")
  .costAnemo(1)
  // TODO
  .build();

/**
 * **元素共鸣：粉碎之冰**
 * 本回合中，我方当前出战角色下一次造成的伤害+2。
 * （牌组包含至少2个冰元素角色，才能加入牌组）
 */
export const ElementalResonanceShatteringIce = createCard(331102)
  .setType("event")
  .addTags("resonance")
  .costCryo(1)
  // TODO
  .build();

/**
 * **元素共鸣：愈疗之水**
 * 治疗我方出战角色2点。然后，治疗所有我方后台角色1点。
 * （牌组包含至少2个水元素角色，才能加入牌组）
 */
export const ElementalResonanceSoothingWater = createCard(331202)
  .setType("event")
  .addTags("resonance")
  .costHydro(1)
  // TODO
  .build();

/**
 * **元素共鸣：蔓生之草**
 * 本回合中，我方下一次引发元素反应时，造成的伤害+2。
 * 使我方场上的燃烧烈焰、草原核和激化领域「可用次数」+1。
 * （牌组包含至少2个草元素角色，才能加入牌组）
 */
export const ElementalResonanceSprawlingGreenery = createCard(331702)
  .setType("event")
  .addTags("resonance")
  .costDendro(1)
  // TODO
  .build();

/**
 * **元素共鸣：交织之火**
 * 生成1个火元素骰。
 * （牌组包含至少2个火元素角色，才能加入牌组）
 */
export const ElementalResonanceWovenFlames = createCard(331301)
  .setType("event")
  .addTags("resonance")
  
  // TODO
  .build();

/**
 * **元素共鸣：交织之冰**
 * 生成1个冰元素骰。
 * （牌组包含至少2个冰元素角色，才能加入牌组）
 */
export const ElementalResonanceWovenIce = createCard(331101)
  .setType("event")
  .addTags("resonance")
  
  // TODO
  .build();

/**
 * **元素共鸣：交织之岩**
 * 生成1个岩元素骰。
 * （牌组包含至少2个岩元素角色，才能加入牌组）
 */
export const ElementalResonanceWovenStone = createCard(331601)
  .setType("event")
  .addTags("resonance")
  
  // TODO
  .build();

/**
 * **元素共鸣：交织之雷**
 * 生成1个雷元素骰。
 * （牌组包含至少2个雷元素角色，才能加入牌组）
 */
export const ElementalResonanceWovenThunder = createCard(331401)
  .setType("event")
  .addTags("resonance")
  
  // TODO
  .build();

/**
 * **元素共鸣：交织之水**
 * 生成1个水元素骰。
 * （牌组包含至少2个水元素角色，才能加入牌组）
 */
export const ElementalResonanceWovenWaters = createCard(331201)
  .setType("event")
  .addTags("resonance")
  
  // TODO
  .build();

/**
 * **元素共鸣：交织之草**
 * 生成1个草元素骰。
 * （牌组包含至少2个草元素角色，才能加入牌组）
 */
export const ElementalResonanceWovenWeeds = createCard(331701)
  .setType("event")
  .addTags("resonance")
  
  // TODO
  .build();

/**
 * **元素共鸣：交织之风**
 * 生成1个风元素骰。
 * （牌组包含至少2个风元素角色，才能加入牌组）
 */
export const ElementalResonanceWovenWinds = createCard(331501)
  .setType("event")
  .addTags("resonance")
  
  // TODO
  .build();

/**
 * **愚人众的阴谋**
 * 在对方场上，生成1个随机类型的「愚人众伏兵」。
 * （牌组包含至少2个「愚人众」角色，才能加入牌组）
 */
export const FatuiConspiracy = createCard(332016)
  .setType("event")
  .addTags()
  .costSame(2)
  // TODO
  .build();

/**
 * **永远的友谊**
 * 手牌数小于4的牌手抓牌，直到手牌数各为4张。
 */
export const FriendshipEternal = createCard(332020)
  .setType("event")
  .addTags()
  .costSame(2)
  // TODO
  .build();

/**
 * **护法之誓**
 * 消灭所有「召唤物」。（不分敌我！）
 */
export const GuardiansOath = createCard(332014)
  .setType("event")
  .addTags()
  .costSame(4)
  // TODO
  .build();

/**
 * **重攻击**
 * 本回合中，当前我方出战角色下次「普通攻击」造成的伤害+1。
 * 此次「普通攻击」为重击时：伤害额外+1。
 */
export const HeavyStrike = createCard(332018)
  .setType("event")
  .addTags()
  .costSame(1)
  // TODO
  .build();

/**
 * **本大爷还没有输！**
 * 本回合有我方角色被击倒，才能打出：
 * 生成1个万能元素，我方当前出战角色获得1点充能。
 */
export const IHaventLostYet = createCard(332005)
  .setType("event")
  .addTags()
  
  // TODO
  .build();

/**
 * **交给我吧！**
 * 我方下次执行「切换角色」行动时：将此次切换视为「快速行动」而非「战斗行动」。
 */
export const LeaveItToMe = createCard(332006)
  .setType("event")
  .addTags()
  
  // TODO
  .build();

/**
 * **诸武精通**
 * 将一个装备在我方角色的「武器」装备牌，转移给另一个武器类型相同的我方角色。
 */
export const MasterOfWeaponry = createCard(332010)
  .setType("event")
  .addTags()
  
  // TODO
  .build();

/**
 * **草与智慧**
 * 抓1张牌。然后，选择任意手牌替换。
 * （牌组包含至少2个「须弥」角色，才能加入牌组）
 */
export const NatureAndWisdom = createCard(331804)
  .setType("event")
  .addTags()
  .costSame(1)
  // TODO
  .build();

/**
 * **下落斩**
 * 战斗行动：切换到目标角色，然后该角色进行「普通攻击」。
 */
export const PlungingStrike = createCard(332017)
  .setType("event")
  .addTags("action")
  .costSame(3)
  // TODO
  .build();

/**
 * **快快缝补术**
 * 选择一个我方「召唤物」，使其「可用次数」+1。
 */
export const QuickKnit = createCard(332012)
  .setType("event")
  .addTags()
  .costSame(1)
  // TODO
  .build();

/**
 * **送你一程**
 * 选择一个敌方「召唤物」，使其「可用次数」-2。
 */
export const SendOff = createCard(332013)
  .setType("event")
  .addTags()
  .costSame(2)
  // TODO
  .build();

/**
 * **星天之兆**
 * 我方当前出战角色获得1点充能。
 */
export const Starsigns = createCard(332008)
  .setType("event")
  .addTags()
  .costVoid(2)
  // TODO
  .build();

/**
 * **岩与契约**
 * 下回合行动阶段开始时：生成3点万能元素。
 * （牌组包含至少2个「璃月」角色，才能加入牌组）
 */
export const StoneAndContracts = createCard(331802)
  .setType("event")
  .addTags()
  .costVoid(3)
  // TODO
  .build();

/**
 * **运筹帷幄**
 * 抓2张牌。
 */
export const Strategize = createCard(332004)
  .setType("event")
  .addTags()
  .costSame(1)
  // TODO
  .build();

/**
 * **最好的伙伴！**
 * 将所花费的元素骰转换为2个万能元素。
 */
export const TheBestestTravelCompanion = createCard(332001)
  .setType("event")
  .addTags()
  .costVoid(2)
  // TODO
  .build();

/**
 * **温妮莎传奇**
 * 生成4个不同类型的基础元素骰。
 */
export const TheLegendOfVennessa = createCard(332019)
  .setType("event")
  .addTags()
  .costSame(3)
  // TODO
  .build();

/**
 * **雷与永恒**
 * 将我方所有元素骰转换为当前出战角色的类型。
 * （牌组包含至少2个「稻妻」角色，才能加入牌组）
 */
export const ThunderAndEternity = createCard(331803)
  .setType("event")
  .addTags()
  
  // TODO
  .build();

/**
 * **一掷乾坤**
 * 选择任意元素骰重投，可重投2次。
 */
export const TossUp = createCard(332003)
  .setType("event")
  .addTags()
  
  // TODO
  .build();

/**
 * **鹤归之时**
 * 我方下一次使用技能后：将下一个我方后台角色切换到场上。
 */
export const WhenTheCraneReturned = createCard(332007)
  .setType("event")
  .addTags()
  .costSame(1)
  // TODO
  .build();

/**
 * **风与自由**
 * 本回合中，轮到我方行动期间有对方角色被击倒时：本次行动结束后，我方可以再连续行动一次。
 * 可用次数：1
 * （牌组包含至少2个「蒙德」角色，才能加入牌组）
 */
export const WindAndFreedom = createCard(331801)
  .setType("event")
  .addTags()
  .costSame(1)
  // TODO
  .build();
