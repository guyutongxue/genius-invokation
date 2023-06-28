import { createCard } from '@gi-tcg';

/**
 * **冒险家头带**
 * 角色使用「普通攻击」后：治疗自身1点。（每回合至多3次）
 * （角色最多装备1件「圣遗物」）
 */
export const AdventurersBandana = createCard(312001)
  .setType("equipment")
  .addTags("artifact")
  .costSame(1)
  // TODO
  .build();

/**
 * **悠古的磐岩**
 * 角色使用技能或装备「天赋」时：少花费1个岩元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出岩元素。
 * （角色最多装备1件「圣遗物」）
 */
export const ArchaicPetra = createCard(312602)
  .setType("equipment")
  .addTags("artifact")
  .costVoid(3)
  // TODO
  .build();

/**
 * **冰风迷途的勇士**
 * 角色使用技能或装备「天赋」时：少花费1个冰元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出冰元素。
 * （角色最多装备1件「圣遗物」）
 */
export const BlizzardStrayer = createCard(312102)
  .setType("equipment")
  .addTags("artifact")
  .costVoid(3)
  // TODO
  .build();

/**
 * **破冰踏雪的回音**
 * 角色使用技能或装备「天赋」时：少花费1个冰元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const BrokenRimesEcho = createCard(312101)
  .setType("equipment")
  .addTags("artifact")
  .costSame(2)
  // TODO
  .build();

/**
 * **无常之面**
 * 角色使用「元素战技」或装备「天赋」时：少花费1个元素骰。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const CapriciousVisage = createCard(312013)
  .setType("equipment")
  .addTags("artifact")
  .costSame(2)
  // TODO
  .build();

/**
 * **炽烈的炎之魔女**
 * 角色使用技能或装备「天赋」时：少花费1个火元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出火元素。
 * （角色最多装备1件「圣遗物」）
 */
export const CrimsonWitchOfFlames = createCard(312302)
  .setType("equipment")
  .addTags("artifact")
  .costVoid(3)
  // TODO
  .build();

/**
 * **深林的记忆**
 * 角色使用技能或装备「天赋」时：少花费1个草元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出草元素。
 * （角色最多装备1件「圣遗物」）
 */
export const DeepwoodMemories = createCard(312702)
  .setType("equipment")
  .addTags("artifact")
  .costVoid(3)
  // TODO
  .build();

/**
 * **绝缘之旗印**
 * 其他我方角色使用「元素爆发」后：所附属角色获得1点充能。
 * 角色使用「元素爆发」造成的伤害+2。
 * （角色最多装备1件「圣遗物」）
 */
export const EmblemOfSeveredFate = createCard(312008)
  .setType("equipment")
  .addTags("artifact")
  .costVoid(3)
  // TODO
  .build();

/**
 * **流放者头冠**
 * 角色使用「元素爆发」后：所有我方后台角色获得1点充能。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const ExilesCirclet = createCard(312006)
  .setType("equipment")
  .addTags("artifact")
  .costVoid(2)
  // TODO
  .build();

/**
 * **赌徒的耳环**
 * 敌方角色被击倒后：如果所附属角色为「出战角色」，则生成2个万能元素。
 * （角色最多装备1件「圣遗物」）
 */
export const GamblersEarrings = createCard(312004)
  .setType("equipment")
  .addTags("artifact")
  .costSame(1)
  // TODO
  .build();

/**
 * **将帅兜鍪**
 * 行动阶段开始时：为角色附属「重嶂不移」。（提供2点护盾，保护该角色。）
 * （角色最多装备1件「圣遗物」）
 */
export const GeneralsAncientHelm = createCard(312009)
  .setType("equipment")
  .addTags("artifact")
  .costSame(2)
  // TODO
  .build();

/**
 * **沉沦之心**
 * 角色使用技能或装备「天赋」时：少花费1个水元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出水元素。
 * （角色最多装备1件「圣遗物」）
 */
export const HeartOfDepth = createCard(312202)
  .setType("equipment")
  .addTags("artifact")
  .costVoid(3)
  // TODO
  .build();

/**
 * **教官的帽子**
 * 角色引发元素反应后：生成1个此角色元素类型的元素骰。（每回合至多3次）
 * （角色最多装备1件「圣遗物」）
 */
export const InstructorsCap = createCard(312005)
  .setType("equipment")
  .addTags("artifact")
  .costVoid(2)
  // TODO
  .build();

/**
 * **月桂的宝冠**
 * 角色使用技能或装备「天赋」时：少花费1个草元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const LaurelCoronet = createCard(312701)
  .setType("equipment")
  .addTags("artifact")
  .costSame(2)
  // TODO
  .build();

/**
 * **幸运儿银冠**
 * 角色使用「元素战技」后：治疗自身2点。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const LuckyDogsSilverCirclet = createCard(312002)
  .setType("equipment")
  .addTags("artifact")
  .costVoid(2)
  // TODO
  .build();

/**
 * **不动玄石之相**
 * 角色使用技能或装备「天赋」时：少花费1个岩元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const MaskOfSolitudeBasalt = createCard(312601)
  .setType("equipment")
  .addTags("artifact")
  .costSame(2)
  // TODO
  .build();

/**
 * **华饰之兜**
 * 其他我方角色使用「元素爆发」后：所附属角色获得1点充能。
 * （角色最多装备1件「圣遗物」）
 */
export const OrnateKabuto = createCard(312007)
  .setType("equipment")
  .addTags("artifact")
  .costVoid(2)
  // TODO
  .build();

/**
 * **追忆之注连**
 * 角色使用「元素战技」或装备「天赋」时：少花费1个元素骰。（每回合1次）
 * 如果角色具有至少2点充能，就使角色「普通攻击」和「元素战技」造成的伤害+1。
 * （角色最多装备1件「圣遗物」）
 */
export const ShimenawasReminiscence = createCard(312014)
  .setType("equipment")
  .addTags("artifact")
  .costSame(3)
  // TODO
  .build();

/**
 * **千岩牢固**
 * 行动阶段开始时：为角色附属「重嶂不移」。（提供2点护盾，保护该角色。）
 * 角色受到伤害后：如果所附属角色为「出战角色」，则生成1个此角色元素类型的元素骰。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const TenacityOfTheMillelith = createCard(312010)
  .setType("equipment")
  .addTags("artifact")
  .costSame(3)
  // TODO
  .build();

/**
 * **如雷的盛怒**
 * 角色使用技能或装备「天赋」时：少花费1个雷元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出雷元素。
 * （角色最多装备1件「圣遗物」）
 */
export const ThunderingFury = createCard(312402)
  .setType("equipment")
  .addTags("artifact")
  .costVoid(3)
  // TODO
  .build();

/**
 * **虺雷之姿**
 * 角色使用「普通攻击」或装备「天赋」时：少花费1个元素骰。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const ThunderingPoise = createCard(312011)
  .setType("equipment")
  .addTags("artifact")
  .costSame(2)
  // TODO
  .build();

/**
 * **唤雷的头冠**
 * 角色使用技能或装备「天赋」时：少花费1个雷元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const ThunderSummonersCrown = createCard(312401)
  .setType("equipment")
  .addTags("artifact")
  .costSame(2)
  // TODO
  .build();

/**
 * **游医的方巾**
 * 角色使用「元素爆发」后：治疗所有我方角色1点。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const TravelingDoctorsHandkerchief = createCard(312003)
  .setType("equipment")
  .addTags("artifact")
  .costSame(1)
  // TODO
  .build();

/**
 * **辰砂往生录**
 * 角色使用「普通攻击」或装备「天赋」时：少花费1个元素骰。（每回合1次）
 * 角色被切换为「出战角色」后：本回合中，角色「普通攻击」造成的伤害+1。
 * （角色最多装备1件「圣遗物」）
 */
export const VermillionHereafter = createCard(312012)
  .setType("equipment")
  .addTags("artifact")
  .costSame(3)
  // TODO
  .build();

/**
 * **翠绿之影**
 * 角色使用技能或装备「天赋」时：少花费1个风元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出风元素。
 * （角色最多装备1件「圣遗物」）
 */
export const ViridescentVenerer = createCard(312502)
  .setType("equipment")
  .addTags("artifact")
  .costVoid(3)
  // TODO
  .build();

/**
 * **翠绿的猎人之冠**
 * 角色使用技能或装备「天赋」时：少花费1个风元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const ViridescentVenerersDiadem = createCard(312501)
  .setType("equipment")
  .addTags("artifact")
  .costSame(2)
  // TODO
  .build();

/**
 * **酒渍船帽**
 * 角色使用技能或装备「天赋」时：少花费1个水元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const WinestainedTricorne = createCard(312201)
  .setType("equipment")
  .addTags("artifact")
  .costSame(2)
  // TODO
  .build();

/**
 * **焦灼的魔女帽**
 * 角色使用技能或装备「天赋」时：少花费1个火元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
export const WitchsScorchingHat = createCard(312301)
  .setType("equipment")
  .addTags("artifact")
  .costSame(2)
  // TODO
  .build();
