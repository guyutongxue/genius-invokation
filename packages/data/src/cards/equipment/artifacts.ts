import { card } from "@gi-tcg/core/builder";

/**
 * @id 312001
 * @name 冒险家头带
 * @description
 * 角色使用「普通攻击」后：治疗自身1点。（每回合至多3次）
 * （角色最多装备1件「圣遗物」）
 */
const AdventurersBandana = card(312001)
  .costSame(1)
  .artifact()
  // TODO
  .done();

/**
 * @id 312002
 * @name 幸运儿银冠
 * @description
 * 角色使用「元素战技」后：治疗自身2点。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const LuckyDogsSilverCirclet = card(312002)
  .costVoid(2)
  .artifact()
  // TODO
  .done();

/**
 * @id 312003
 * @name 游医的方巾
 * @description
 * 角色使用「元素爆发」后：治疗所有我方角色1点。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const TravelingDoctorsHandkerchief = card(312003)
  .costSame(1)
  .artifact()
  // TODO
  .done();

/**
 * @id 312004
 * @name 赌徒的耳环
 * @description
 * 敌方角色被击倒后：如果所附属角色为「出战角色」，则生成2个万能元素。（整场牌局限制3次）
 * （角色最多装备1件「圣遗物」）
 */
const GamblersEarrings = card(312004)
  .costSame(1)
  .artifact()
  // TODO
  .done();

/**
 * @id 312005
 * @name 教官的帽子
 * @description
 * 角色引发元素反应后：生成1个此角色元素类型的元素骰。（每回合至多3次）
 * （角色最多装备1件「圣遗物」）
 */
const InstructorsCap = card(312005)
  .costVoid(2)
  .artifact()
  // TODO
  .done();

/**
 * @id 312006
 * @name 流放者头冠
 * @description
 * 角色使用「元素爆发」后：所有我方后台角色获得1点充能。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const ExilesCirclet = card(312006)
  .costVoid(2)
  .artifact()
  // TODO
  .done();

/**
 * @id 312007
 * @name 华饰之兜
 * @description
 * 其他我方角色使用「元素爆发」后：所附属角色获得1点充能。
 * （角色最多装备1件「圣遗物」）
 */
const OrnateKabuto = card(312007)
  .costSame(1)
  .artifact()
  // TODO
  .done();

/**
 * @id 312008
 * @name 绝缘之旗印
 * @description
 * 其他我方角色使用「元素爆发」后：所附属角色获得1点充能。
 * 角色使用「元素爆发」造成的伤害+2。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const EmblemOfSeveredFate = card(312008)
  .costSame(2)
  .artifact()
  // TODO
  .done();

/**
 * @id 312009
 * @name 将帅兜鍪
 * @description
 * 行动阶段开始时：为角色附属「重嶂不移」。（提供2点护盾，保护该角色。）
 * （角色最多装备1件「圣遗物」）
 */
const GeneralsAncientHelm = card(312009)
  .costSame(2)
  .artifact()
  // TODO
  .done();

/**
 * @id 312010
 * @name 千岩牢固
 * @description
 * 行动阶段开始时：为角色附属「重嶂不移」。（提供2点护盾，保护该角色。）
 * 角色受到伤害后：如果所附属角色为「出战角色」，则生成1个此角色元素类型的元素骰。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const TenacityOfTheMillelith = card(312010)
  .costSame(3)
  .artifact()
  // TODO
  .done();

/**
 * @id 312011
 * @name 虺雷之姿
 * @description
 * 角色使用「普通攻击」或装备「天赋」时：少花费1个元素骰。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const ThunderingPoise = card(312011)
  .costVoid(2)
  .artifact()
  // TODO
  .done();

/**
 * @id 312012
 * @name 辰砂往生录
 * @description
 * 角色使用「普通攻击」或装备「天赋」时：少花费1个元素骰。（每回合1次）
 * 角色被切换为「出战角色」后：本回合中，角色「普通攻击」造成的伤害+1。
 * （角色最多装备1件「圣遗物」）
 */
const VermillionHereafter = card(312012)
  .costVoid(3)
  .artifact()
  // TODO
  .done();

/**
 * @id 312013
 * @name 无常之面
 * @description
 * 角色使用「元素战技」或装备「天赋」时：少花费1个元素骰。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const CapriciousVisage = card(312013)
  .costVoid(2)
  .artifact()
  // TODO
  .done();

/**
 * @id 312014
 * @name 追忆之注连
 * @description
 * 角色使用「元素战技」或装备「天赋」时：少花费1个元素骰。（每回合1次）
 * 如果角色具有至少2点充能，就使角色「普通攻击」和「元素战技」造成的伤害+1。
 * （角色最多装备1件「圣遗物」）
 */
const ShimenawasReminiscence = card(312014)
  .costVoid(3)
  .artifact()
  // TODO
  .done();

/**
 * @id 312015
 * @name 海祇之冠
 * @description
 * 我方角色每受到3点治疗，此牌就累积1个「海染泡沫」。（最多累积2个）
 * 角色造成伤害时：消耗所有「海染泡沫」，每消耗1个都使造成的伤害+1。
 * （角色最多装备1件「圣遗物」）
 */
const CrownOfWatatsumi = card(312015)
  .costSame(1)
  .artifact()
  // TODO
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
const OceanhuedClam = card(312016)
  .costVoid(3)
  .artifact()
  // TODO
  .done();

/**
 * @id 312017
 * @name 沙王的投影
 * @description
 * 入场时：抓1张牌。
 * 所附属角色为出战角色期间，敌方受到元素反应伤害时：抓1张牌。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const ShadowOfTheSandKing = card(312017)
  .costSame(1)
  .artifact()
  // TODO
  .done();

/**
 * @id 312101
 * @name 破冰踏雪的回音
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个冰元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const BrokenRimesEcho = card(312101)
  .costVoid(2)
  .artifact()
  // TODO
  .done();

/**
 * @id 312201
 * @name 酒渍船帽
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个水元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const WinestainedTricorne = card(312201)
  .costVoid(2)
  .artifact()
  // TODO
  .done();

/**
 * @id 312301
 * @name 焦灼的魔女帽
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个火元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const WitchsScorchingHat = card(312301)
  .costVoid(2)
  .artifact()
  // TODO
  .done();

/**
 * @id 312401
 * @name 唤雷的头冠
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个雷元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const ThunderSummonersCrown = card(312401)
  .costVoid(2)
  .artifact()
  // TODO
  .done();

/**
 * @id 312501
 * @name 翠绿的猎人之冠
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个风元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const ViridescentVenerersDiadem = card(312501)
  .costVoid(2)
  .artifact()
  // TODO
  .done();

/**
 * @id 312601
 * @name 不动玄石之相
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个岩元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const MaskOfSolitudeBasalt = card(312601)
  .costVoid(2)
  .artifact()
  // TODO
  .done();

/**
 * @id 312701
 * @name 月桂的宝冠
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个草元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const LaurelCoronet = card(312701)
  .costVoid(2)
  .artifact()
  // TODO
  .done();

/**
 * @id 312102
 * @name 冰风迷途的勇士
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个冰元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出冰元素。
 * （角色最多装备1件「圣遗物」）
 */
const BlizzardStrayer = card(312102)
  .costSame(2)
  .artifact()
  // TODO
  .done();

/**
 * @id 312202
 * @name 沉沦之心
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个水元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出水元素。
 * （角色最多装备1件「圣遗物」）
 */
const HeartOfDepth = card(312202)
  .costSame(2)
  .artifact()
  // TODO
  .done();

/**
 * @id 312302
 * @name 炽烈的炎之魔女
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个火元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出火元素。
 * （角色最多装备1件「圣遗物」）
 */
const CrimsonWitchOfFlames = card(312302)
  .costSame(2)
  .artifact()
  // TODO
  .done();

/**
 * @id 312402
 * @name 如雷的盛怒
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个雷元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出雷元素。
 * （角色最多装备1件「圣遗物」）
 */
const ThunderingFury = card(312402)
  .costSame(2)
  .artifact()
  // TODO
  .done();

/**
 * @id 312502
 * @name 翠绿之影
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个风元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出风元素。
 * （角色最多装备1件「圣遗物」）
 */
const ViridescentVenerer = card(312502)
  .costSame(2)
  .artifact()
  // TODO
  .done();

/**
 * @id 312602
 * @name 悠古的磐岩
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个岩元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出岩元素。
 * （角色最多装备1件「圣遗物」）
 */
const ArchaicPetra = card(312602)
  .costSame(2)
  .artifact()
  // TODO
  .done();

/**
 * @id 312702
 * @name 深林的记忆
 * @description
 * 角色使用技能或装备「天赋」时：少花费1个草元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出草元素。
 * （角色最多装备1件「圣遗物」）
 */
const DeepwoodMemories = card(312702)
  .costSame(2)
  .artifact()
  // TODO
  .done();

/**
 * @id 312018
 * @name 饰金之梦
 * @description
 * 入场时：生成1个所附属角色类型的元素骰。如果我方队伍中存在3种不同元素类型的角色，则额外生成1个万能元素。
 * 所附属角色为出战角色期间，敌方受到元素反应伤害时：抓1张牌。（每回合至多2次）
 * （角色最多装备1件「圣遗物」）
 */
const GildedDreams = card(312018)
  .costVoid(3)
  .artifact()
  // TODO
  .done();

/**
 * @id 312019
 * @name 浮溯之珏
 * @description
 * 角色使用「普通攻击」后：抓1张牌。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const FlowingRings = card(312019)
  .artifact()
  // TODO
  .done();

/**
 * @id 312020
 * @name 来歆余响
 * @description
 * 角色使用「普通攻击」后：抓1张牌。（每回合1次）
 * 角色使用技能后：如果我方元素骰数量不多于手牌数量，则生成1个所附属角色类型的元素骰。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const EchoesOfAnOffering = card(312020)
  .costSame(2)
  .artifact()
  // TODO
  .done();

/**
 * @id 312021
 * @name 灵光明烁之心
 * @description
 * 角色受到伤害后：如果所附属角色为「出战角色」，则抓1张牌。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const HeartOfKhvarenasBrilliance = card(312021)
  .artifact()
  // TODO
  .done();

/**
 * @id 312022
 * @name 花海甘露之光
 * @description
 * 角色受到伤害后：如果所附属角色为「出战角色」，则抓1张牌。（每回合1次）
 * 结束阶段：治疗所附属角色1点。
 * （角色最多装备1件「圣遗物」）
 */
const VourukashasGlow = card(312022)
  .costSame(1)
  .artifact()
  // TODO
  .done();
