import { DiceType, card, status } from "@gi-tcg/core/builder";

/**
 * @id 312101
 * @name 破冰踏雪的回音
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个冰元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const BrokenRimesEcho = card(312101)
  .costVoid(2)
  .artifact()
  .on("deductDiceSkillOrTalent", (c, e) => e.canDeductCostOfType(DiceType.Cryo))
  .usagePerRound(1)
  .deductCost(DiceType.Cryo, 1)
  .done();

/**
 * @id 312201
 * @name 酒渍船帽
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个水元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const WinestainedTricorne = card(312201)
  .costVoid(2)
  .artifact()
  .on("deductDiceSkillOrTalent", (c, e) => e.canDeductCostOfType(DiceType.Hydro))
  .usagePerRound(1)
  .deductCost(DiceType.Hydro, 1)
  .done();

/**
 * @id 312301
 * @name 焦灼的魔女帽
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个火元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const WitchsScorchingHat = card(312301)
  .costVoid(2)
  .artifact()
  .on("deductDiceSkillOrTalent", (c, e) => e.canDeductCostOfType(DiceType.Pyro))
  .usagePerRound(1)
  .deductCost(DiceType.Pyro, 1)
  .done();

/**
 * @id 312401
 * @name 唤雷的头冠
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个雷元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const ThunderSummonersCrown = card(312401)
  .costVoid(2)
  .artifact()
  .on("deductDiceSkillOrTalent", (c, e) => e.canDeductCostOfType(DiceType.Electro))
  .usagePerRound(1)
  .deductCost(DiceType.Electro, 1)
  .done();

/**
 * @id 312501
 * @name 翠绿的猎人之冠
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个风元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const ViridescentVenerersDiadem = card(312501)
  .costVoid(2)
  .artifact()
  .on("deductDiceSkillOrTalent", (c, e) => e.canDeductCostOfType(DiceType.Anemo))
  .usagePerRound(1)
  .deductCost(DiceType.Anemo, 1)
  .done();

/**
 * @id 312601
 * @name 不动玄石之相
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个岩元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const MaskOfSolitudeBasalt = card(312601)
  .costVoid(2)
  .artifact()
  .on("deductDiceSkillOrTalent", (c, e) => e.canDeductCostOfType(DiceType.Geo))
  .usagePerRound(1)
  .deductCost(DiceType.Geo, 1)
  .done();

/**
 * @id 312701
 * @name 月桂的宝冠
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个草元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const LaurelCoronet = card(312701)
  .costVoid(2)
  .artifact()
  .on("deductDiceSkillOrTalent", (c, e) => e.canDeductCostOfType(DiceType.Dendro))
  .usagePerRound(1)
  .deductCost(DiceType.Dendro, 1)
  .done();

/**
 * @id 312102
 * @name 冰风迷途的勇士
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个冰元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出冰元素。
 * （角色最多装备1件「圣遗物」）
 */
export const BlizzardStrayer = card(312102)
  .costSame(2)
  .artifact()
  .on("deductDiceSkillOrTalent", (c, e) => e.canDeductCostOfType(DiceType.Cryo))
  .deductCost(DiceType.Cryo, 1)
  .on("roll")
  .fixDice(DiceType.Cryo, 2)
  .done();

/**
 * @id 312202
 * @name 沉沦之心
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个水元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出水元素。
 * （角色最多装备1件「圣遗物」）
 */
export const HeartOfDepth = card(312202)
  .costSame(2)
  .artifact()
  .on("deductDiceSkillOrTalent", (c, e) => e.canDeductCostOfType(DiceType.Hydro))
  .deductCost(DiceType.Hydro, 1)
  .on("roll")
  .fixDice(DiceType.Hydro, 2)
  .done();

/**
 * @id 312302
 * @name 炽烈的炎之魔女
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个火元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出火元素。
 * （角色最多装备1件「圣遗物」）
 */
export const CrimsonWitchOfFlames = card(312302)
  .costSame(2)
  .artifact()
  .on("deductDiceSkillOrTalent", (c, e) => e.canDeductCostOfType(DiceType.Pyro))
  .deductCost(DiceType.Pyro, 1)
  .on("roll")
  .fixDice(DiceType.Pyro, 2)
  .done();

/**
 * @id 312402
 * @name 如雷的盛怒
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个雷元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出雷元素。
 * （角色最多装备1件「圣遗物」）
 */
export const ThunderingFury = card(312402)
  .costSame(2)
  .artifact()
  .on("deductDiceSkillOrTalent", (c, e) => e.canDeductCostOfType(DiceType.Electro))
  .deductCost(DiceType.Electro, 1)
  .on("roll")
  .fixDice(DiceType.Electro, 2)
  .done();

/**
 * @id 312502
 * @name 翠绿之影
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个风元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出风元素。
 * （角色最多装备1件「圣遗物」）
 */
export const ViridescentVenerer = card(312502)
  .costSame(2)
  .artifact()
  .on("deductDiceSkillOrTalent", (c, e) => e.canDeductCostOfType(DiceType.Anemo))
  .deductCost(DiceType.Anemo, 1)
  .on("roll")
  .fixDice(DiceType.Anemo, 2)
  .done();

/**
 * @id 312602
 * @name 悠古的磐岩
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个岩元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出岩元素。
 * （角色最多装备1件「圣遗物」）
 */
export const ArchaicPetra = card(312602)
  .costSame(2)
  .artifact()
  .on("deductDiceSkillOrTalent", (c, e) => e.canDeductCostOfType(DiceType.Geo))
  .deductCost(DiceType.Geo, 1)
  .on("roll")
  .fixDice(DiceType.Geo, 2)
  .done();

/**
 * @id 312702
 * @name 深林的记忆
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个草元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出草元素。
 * （角色最多装备1件「圣遗物」）
 */
export const DeepwoodMemories = card(312702)
  .costSame(2)
  .artifact()
  .on("deductDiceSkillOrTalent", (c, e) => e.canDeductCostOfType(DiceType.Dendro))
  .deductCost(DiceType.Dendro, 1)
  .on("roll")
  .fixDice(DiceType.Dendro, 2)
  .done();

/**
 * @id 312001
 * @name 冒险家头带
 * @description
 * 角色使用「普通攻击」后：治疗自身1点。（每回合至多3次）
 * （角色最多装备1件「圣遗物」）
 */
export const AdventurersBandana = card(312001)
  .costSame(1)
  .artifact()
  .on("useSkill", (c, e) => e.isSkillType("normal"))
  .usagePerRound(3)
  .heal(1, "@master")
  .done();

/**
 * @id 312002
 * @name 幸运儿银冠
 * @description
 * 角色使用「元素战技」后：治疗自身2点。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const LuckyDogsSilverCirclet = card(312002)
  .costVoid(2)
  .artifact()
  .on("useSkill", (c, e) => e.isSkillType("elemental"))
  .usagePerRound(1)
  .heal(2, "@master")
  .done();

/**
 * @id 312003
 * @name 游医的方巾
 * @description
 * 角色使用「元素爆发」后：治疗所有我方角色1点。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const TravelingDoctorsHandkerchief = card(312003)
  .costSame(1)
  .artifact()
  .on("useSkill", (c, e) => e.isSkillType("burst"))
  .usagePerRound(1)
  .heal(1, "all my characters")
  .done();

/**
 * @id 312004
 * @name 赌徒的耳环
 * @description
 * 敌方角色被击倒后：如果所附属角色为「出战角色」，则生成2个万能元素。（整场牌局限制3次）
 * （角色最多装备1件「圣遗物」）
 */
export const GamblersEarrings = card(312004)
  .costSame(1)
  .artifact()
  .on("defeated", (c, e) => c.self.master().isActive() && !c.of(e.character).isMine())
  .listenToAll()
  .usage(3, { autoDispose: false })
  .generateDice(DiceType.Omni, 2)
  .done();

/**
 * @id 312005
 * @name 教官的帽子
 * @description
 * 角色引发元素反应后：生成1个此角色元素类型的元素骰。（每回合至多3次）
 * （角色最多装备1件「圣遗物」）
 */
export const InstructorsCap = card(312005)
  .costVoid(2)
  .artifact()
  .on("dealDamage", (c, e) => e.getReaction())
  .usagePerRound(3)
  .do((c) => {
    c.generateDice(c.self.master().element(), 1);
  })
  .done();

/**
 * @id 312006
 * @name 流放者头冠
 * @description
 * 角色使用「元素爆发」后：所有我方后台角色获得1点充能。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const ExilesCirclet = card(312006)
  .costVoid(2)
  .artifact()
  .on("useSkill", (c, e) => e.isSkillType("burst"))
  .usagePerRound(1)
  .gainEnergy(1, "my standby")
  .done();

/**
 * @id 312007
 * @name 华饰之兜
 * @description
 * 其他我方角色使用「元素爆发」后：所附属角色获得1点充能。
 * （角色最多装备1件「圣遗物」）
 */
export const OrnateKabuto = card(312007)
  .costSame(1)
  .artifact()
  .on("useSkill", (c, e) => e.caller.id !== c.self.master().id && e.isSkillType("burst"))
  .listenToPlayer()
  .gainEnergy(1, "@master")
  .done();

/**
 * @id 312008
 * @name 绝缘之旗印
 * @description
 * 其他我方角色使用「元素爆发」后：所附属角色获得1点充能。
 * 角色使用「元素爆发」造成的伤害+2。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const EmblemOfSeveredFate = card(312008)
  .costSame(2)
  .artifact()
  .on("useSkill", (c, e) => e.caller.id !== c.self.master().id && e.isSkillType("burst"))
  .listenToPlayer()
  .gainEnergy(1, "@master")
  .on("modifySkillDamage", (c, e) => e.isSourceSkillType("burst"))
  .usagePerRound(1)
  .increaseDamage(2)
  .done();

/**
 * @id 301201
 * @name 重嶂不移
 * @description
 * 提供2点护盾，保护所附属的角色。
 */
export const UnmovableMountain = status(301201)
  .shield(2)
  .done();

/**
 * @id 312009
 * @name 将帅兜鍪
 * @description
 * 行动阶段开始时：为角色附属「重嶂不移」。（提供2点护盾，保护该角色。）
 * （角色最多装备1件「圣遗物」）
 */
export const GeneralsAncientHelm = card(312009)
  .costSame(2)
  .artifact()
  .on("actionPhase")
  .characterStatus(UnmovableMountain)
  .done();

/**
 * @id 312010
 * @name 千岩牢固
 * @description
 * 行动阶段开始时：为角色附属「重嶂不移」。（提供2点护盾，保护该角色。）
 * 角色受到伤害后：如果所附属角色为「出战角色」，则生成1个此角色元素类型的元素骰。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const TenacityOfTheMillelith = card(312010)
  .costSame(3)
  .artifact()
  .on("actionPhase")
  .characterStatus(UnmovableMountain)
  .on("damaged", (c) => c.self.master().isActive())
  .usagePerRound(1)
  .do((c) => {
    c.generateDice(c.self.master().element(), 1);
  })
  .done();

/**
 * @id 312011
 * @name 虺雷之姿
 * @description
 * 角色使用「普通攻击」或装备「天赋」时：少花费1个元素骰。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const ThunderingPoise = card(312011)
  .costVoid(2)
  .artifact()
  .on("deductDiceSkillOrTalent", (c, e) => e.isPlayCard() || e.isSkillType("normal"))
  .usagePerRound(1)
  .deductCost(DiceType.Omni, 1)
  .done();

/**
 * @id 301203
 * @name 辰砂往生录（生效中）
 * @description
 * 本回合中，角色「普通攻击」造成的伤害+1。
 */
const VermillionHereafterEffect = status(301203)
  .oneDuration()
  .on("modifySkillDamage", (c, e) => e.isSourceSkillType("normal"))
  .increaseDamage(1)
  .done();

/**
 * @id 312012
 * @name 辰砂往生录
 * @description
 * 角色使用「普通攻击」或装备「天赋」时：少花费1个元素骰。（每回合1次）
 * 角色被切换为「出战角色」后：本回合中，角色「普通攻击」造成的伤害+1。
 * （角色最多装备1件「圣遗物」）
 */
export const VermillionHereafter = card(312012)
  .costVoid(3)
  .artifact()
  .on("deductDiceSkillOrTalent", (c, e) => e.isPlayCard() || e.isSkillType("normal"))
  .usagePerRound(1)
  .deductCost(DiceType.Omni, 1)
  .on("switchActive", (c, e) => c.self.master().id === e.switchInfo.to.id)
  .characterStatus(VermillionHereafterEffect)
  .done();

/**
 * @id 312013
 * @name 无常之面
 * @description
 * 角色使用「元素战技」或装备「天赋」时：少花费1个元素骰。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const CapriciousVisage = card(312013)
  .costVoid(2)
  .artifact()
  .on("deductDiceSkillOrTalent", (c, e) => e.isPlayCard() || e.isSkillType("elemental"))
  .usagePerRound(1)
  .deductCost(DiceType.Omni, 1)
  .done();

/**
 * @id 312014
 * @name 追忆之注连
 * @description
 * 角色使用「元素战技」或装备「天赋」时：少花费1个元素骰。（每回合1次）
 * 如果角色具有至少2点充能，就使角色「普通攻击」和「元素战技」造成的伤害+1。
 * （角色最多装备1件「圣遗物」）
 */
export const ShimenawasReminiscence = card(312014)
  .costVoid(3)
  .artifact()
  .on("deductDiceSkillOrTalent", (c, e) => e.isPlayCard() || e.isSkillType("elemental"))
  .usagePerRound(1)
  .deductCost(DiceType.Omni, 1)
  .on("modifySkillDamage", (c, e) =>
    c.self.master().energy >= 2 &&
    (e.isSourceSkillType("normal") || e.isSourceSkillType("elemental")))
  .increaseDamage(1)
  .done();

/**
 * @id 312015
 * @name 海祇之冠
 * @description
 * 我方角色每受到3点治疗，此牌就累积1个「海染泡沫」。（最多累积2个）
 * 角色造成伤害时：消耗所有「海染泡沫」，每消耗1个都使造成的伤害+1。
 * （角色最多装备1件「圣遗物」）
 */
export const CrownOfWatatsumi = card(312015)
  .costSame(1)
  .artifact()
  .variable("healedPts", 0, { visible: false })
  .variable("bubble", 0)
  .on("healed")
  .do((c, e) => {
    c.addVariable("healedPts", e.value);
    const totalPts = c.getVariable("healedPts");
    const generatedBubbleCount = Math.floor(totalPts / 3);
    const restPts = totalPts % 3;
    const currentBubbleCount = c.getVariable("bubble");
    c.setVariable("bubble", Math.min(2, currentBubbleCount + generatedBubbleCount));
    c.setVariable("healedPts", restPts);
  })
  .on("modifyDamage")
  .do((c, e) => {
    const bubbleCount = c.getVariable("bubble");
    c.setVariable("bubble", 0);
    e.increaseDamage(bubbleCount);
  })
  .done();

/**
 * @id 312016
 * @name 海染砗磲
 * @description
 * 入场时：治疗所附属角色2点。
 * 我方角色每受到3点治疗，此牌就累积1个「海染泡沫」。（最多累积2个）
 * 角色造成伤害时：消耗所有「海染泡沫」，每消耗1个都使造成的伤害+1。
 * （角色最多装备1件「圣遗物」）
 */
export const OceanhuedClam = card(312016)
  .costVoid(3)
  .artifact()
  .variable("healedPts", 0, { visible: false })
  .variable("bubble", 0)
  .on("enter")
  .heal(2, "@master")
  .on("healed")
  .do((c, e) => {
    c.addVariable("healedPts", e.value);
    const totalPts = c.getVariable("healedPts");
    const generatedBubbleCount = Math.floor(totalPts / 3);
    const restPts = totalPts % 3;
    const currentBubbleCount = c.getVariable("bubble");
    c.setVariable("bubble", Math.min(2, currentBubbleCount + generatedBubbleCount));
    c.setVariable("healedPts", restPts);
  })
  .on("modifyDamage")
  .do((c, e) => {
    const bubbleCount = c.getVariable("bubble");
    c.setVariable("bubble", 0);
    e.increaseDamage(bubbleCount);
  })
  .done();

/**
 * @id 312017
 * @name 沙王的投影
 * @description
 * 入场时：抓1张牌。
 * 所附属角色为出战角色期间，敌方受到元素反应伤害时：抓1张牌。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const ShadowOfTheSandKing = card(312017)
  .costSame(1)
  .artifact()
  .on("enter")
  .drawCards(1)
  .on("damaged", (c, e) => !c.of(e.target).isMine() && e.getReaction())
  .listenToAll()
  .usagePerRound(1)
  .drawCards(1)
  .done();

/**
 * @id 312018
 * @name 饰金之梦
 * @description
 * 入场时：生成1个所附属角色类型的元素骰。如果我方队伍中存在3种不同元素类型的角色，则额外生成1个万能元素。
 * 所附属角色为出战角色期间，敌方受到元素反应伤害时：抓1张牌。（每回合至多2次）
 * （角色最多装备1件「圣遗物」）
 */
export const GildedDreams = card(312018)
  .costVoid(3)
  .artifact()
  .on("enter")
  .do((c) => {
    c.generateDice(c.self.master().element(), 1);
    const elementKinds = new Set(c.$$("my characters include defeated").map((ch) => ch.element()));
    if (elementKinds.size >= 3) {
      c.generateDice(DiceType.Omni, 1);
    }
  })
  .on("damaged", (c, e) => !c.of(e.target).isMine() && e.getReaction())
  .listenToAll()
  .usagePerRound(2)
  .drawCards(1)
  .done();

/**
 * @id 312019
 * @name 浮溯之珏
 * @description
 * 角色使用「普通攻击」后：抓1张牌。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const FlowingRings = card(312019)
  .artifact()
  .on("useSkill", (c, e) => e.isSkillType("normal"))
  .drawCards(1)
  .done();

/**
 * @id 312020
 * @name 来歆余响
 * @description
 * 角色使用「普通攻击」后：抓1张牌。（每回合1次）
 * 角色使用技能后：如果我方元素骰数量不多于手牌数量，则生成1个所附属角色类型的元素骰。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const EchoesOfAnOffering = card(312020)
  .costSame(2)
  .artifact()
  .on("useSkill", (c, e) => e.isSkillType("normal"))
  .usagePerRound(1)
  .drawCards(1)
  .on("useSkill")
  .usagePerRound(1)
  .do((c) => {
    if (c.player.dice.length <= c.player.hands.length) {
      c.generateDice(c.self.master().element(), 1);
    }
  })
  .done();

/**
 * @id 312021
 * @name 灵光明烁之心
 * @description
 * 角色受到伤害后：如果所附属角色为「出战角色」，则抓1张牌。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const HeartOfKhvarenasBrilliance = card(312021)
  .artifact()
  .on("damaged", (c) => c.self.master().isActive())
  .usagePerRound(1)
  .drawCards(1)
  .done();

/**
 * @id 312022
 * @name 花海甘露之光
 * @description
 * 角色受到伤害后：如果所附属角色为「出战角色」，则抓1张牌，并且在本回合结束阶段中治疗所附属角色1点。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const VourukashasGlow = card(312022)
  .costSame(1)
  .artifact()
  .variable("shouldHeal", 0)
  .on("damaged", (c) => c.self.master().isActive())
  .usagePerRound(1)
  .addVariable("shouldHeal", 1)
  .drawCards(1)
  .on("endPhase", (c) => c.getVariable("shouldHeal"))
  .heal(1, "@master")
  .setVariable("shouldHeal", 0)
  .done();

/**
 * @id 312023
 * @name 老兵的容颜
 * @description
 * 角色受到伤害或治疗后：根据本回合触发此效果的次数，执行不同的效果。
 * 第一次触发：生成1个此角色类型的元素骰。
 * 第二次触发：抓1张牌。
 * （角色最多装备1件「圣遗物」）
 */
export const VeteransVisage = card(312023)
  .costVoid(2)
  .artifact()
  .variable("triggered", 0)
  .on("actionPhase")
  .setVariable("triggered", 0)
  .on("damaged")
  .do((c) => {
    c.addVariable("triggered", 1);
    const triggered = c.getVariable("triggered");
    if (triggered === 1) {
      c.generateDice(c.self.master().element(), 1);
    } else if (triggered === 2) {
      c.drawCards(1);
    }
  })
  .on("healed")
  .do((c) => {
    c.addVariable("triggered", 1);
    const triggered = c.getVariable("triggered");
    if (triggered === 1) {
      c.generateDice(c.self.master().element(), 1);
    } else if (triggered === 2) {
      c.drawCards(1);
    }
  })
  .done();
