import { DiceType, Target, createCard, createStatus } from '@gi-tcg';

/**
 * **冒险家头带**
 * 角色使用「普通攻击」后：治疗自身1点。（每回合至多3次）
 * （角色最多装备1件「圣遗物」）
 */
const AdventurersBandana = createCard(312001, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costSame(1)
  .buildToEquipment()
  .withUsagePerRound(3)
  .on("useSkill", (c) => {
    if (c.info.type === "normal") {
      c.getMaster().heal(1);
    } else {
      return false;
    }
  })
  .build();

/**
 * **悠古的磐岩**
 * 角色使用技能或装备「天赋」时：少花费1个岩元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出岩元素。
 * （角色最多装备1件「圣遗物」）
 */
const ArchaicPetra = createCard(312602, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costVoid(3)
  .buildToEquipment()
  .withUsagePerRound(1)
  .on("beforeUseDice", (c) => {
    if (c.useSkillCtx || c.playCardCtx?.isTalentOf(c.getMaster().info.id)) {
      c.deductCost(DiceType.Geo);
    } else {
      return false;
    }
  })
  .on("rollPhase", (c) => (c.fixDice(DiceType.Geo, DiceType.Geo), false))
  .build();

/**
 * **冰风迷途的勇士**
 * 角色使用技能或装备「天赋」时：少花费1个冰元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出冰元素。
 * （角色最多装备1件「圣遗物」）
 */
const BlizzardStrayer = createCard(312102, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costVoid(3)
  .buildToEquipment()
  .withUsagePerRound(1)
  .on("beforeUseDice", (c) => {
    if (c.useSkillCtx || c.playCardCtx?.isTalentOf(c.getMaster().info.id)) {
      c.deductCost(DiceType.Cryo);
    } else {
      return false;
    }
  })
  .on("rollPhase", (c) => (c.fixDice(DiceType.Cryo, DiceType.Cryo), false))
  .build();

/**
 * **破冰踏雪的回音**
 * 角色使用技能或装备「天赋」时：少花费1个冰元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const BrokenRimesEcho = createCard(312101, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costSame(2)
  .buildToEquipment()
  .withUsagePerRound(1)
  .on("beforeUseDice", (c) => {
    if (c.useSkillCtx || c.playCardCtx?.isTalentOf(c.getMaster().info.id)) {
      c.deductCost(DiceType.Cryo);
    } else {
      return false;
    }
  })
  .build();

/**
 * **无常之面**
 * 角色使用「元素战技」或装备「天赋」时：少花费1个元素骰。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const CapriciousVisage = createCard(312013, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costSame(2)
  .buildToEquipment()
  .withUsagePerRound(1)
  .on("beforeUseDice", (c) => {
    if (c.useSkillCtx?.info.type === "elemental" ||
      c.playCardCtx?.isTalentOf(c.getMaster().info.id)) {
      c.deductCost(DiceType.Omni);
    } else {
      return false;
    }
  })
  .build();

/**
 * **炽烈的炎之魔女**
 * 角色使用技能或装备「天赋」时：少花费1个火元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出火元素。
 * （角色最多装备1件「圣遗物」）
 */
const CrimsonWitchOfFlames = createCard(312302, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costVoid(3)
  .buildToEquipment()
  .withUsagePerRound(1)
  .on("beforeUseDice", (c) => {
    if (c.useSkillCtx || c.playCardCtx?.isTalentOf(c.getMaster().info.id)) {
      c.deductCost(DiceType.Pyro);
    } else {
      return false;
    }
  })
  .on("rollPhase", (c) => (c.fixDice(DiceType.Pyro, DiceType.Pyro), false))
  .build();

/**
 * **深林的记忆**
 * 角色使用技能或装备「天赋」时：少花费1个草元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出草元素。
 * （角色最多装备1件「圣遗物」）
 */
const DeepwoodMemories = createCard(312702, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costVoid(3)
  .buildToEquipment()
  .withUsagePerRound(1)
  .on("beforeUseDice", (c) => {
    if (c.useSkillCtx || c.playCardCtx?.isTalentOf(c.getMaster().info.id)) {
      c.deductCost(DiceType.Dendro);
    } else {
      return false;
    }
  })
  .on("rollPhase", (c) => (c.fixDice(DiceType.Dendro, DiceType.Dendro), false))
  .build();

/**
 * **绝缘之旗印**
 * 其他我方角色使用「元素爆发」后：所附属角色获得1点充能。
 * 角色使用「元素爆发」造成的伤害+2。
 * （角色最多装备1件「圣遗物」）
 */
const EmblemOfSeveredFate = createCard(312008, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costVoid(3)
  .buildToEquipment()
  .listenToOther()
  .on("useSkill", (c) => {
    if (c.info.type !== "burst" && c.character.info.id !== c.getMaster().info.id) {
      c.character.gainEnergy(1);
    }
  })
  .on("beforeSkillDamage", (c) => {
    if (c.skillInfo.type === "burst" && c.characterInfo.id === c.getMaster().info.id) {
      c.addDamage(2);
    }
  })
  .build();

/**
 * **流放者头冠**
 * 角色使用「元素爆发」后：所有我方后台角色获得1点充能。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const ExilesCirclet = createCard(312006, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costVoid(2)
  .buildToEquipment()
  .withUsagePerRound(1)
  .on("useSkill", (c) => {
    if (c.info.type === "burst") {
      c.gainEnergy(1, Target.myStandby());
    } else {
      return false;
    }
  })
  .build();

/**
 * **赌徒的耳环**
 * 敌方角色被击倒后：如果所附属角色为「出战角色」，则生成2个万能元素。
 * （角色最多装备1件「圣遗物」）
 * TODO 3.8 更新：该装备牌的效果整场牌局限制3次；
 */
const GamblersEarrings = createCard(312004, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costSame(1)
  .buildToEquipment()
  .listenToOpp()
  .on("defeated", (c) => {
    if (!c.target.isMine() && c.getMaster().isActive()) {
      c.generateDice(DiceType.Omni, DiceType.Omni);
    }
  })
  .build();

/**
 * **重嶂不移**
 * 提供2点护盾，保护所附属的角色。
 */
const UnmovableMountain = createStatus(301201)
  .shield(2)
  .build();

/**
 * **将帅兜鍪**
 * 行动阶段开始时：为角色附属「重嶂不移」。（提供2点护盾，保护该角色。）
 * （角色最多装备1件「圣遗物」）
 */
const GeneralsAncientHelm = createCard(312009, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costSame(2)
  .buildToEquipment()
  .on("actionPhase", (c) => { c.createStatus(UnmovableMountain) })
  .build();

/**
 * **沉沦之心**
 * 角色使用技能或装备「天赋」时：少花费1个水元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出水元素。
 * （角色最多装备1件「圣遗物」）
 */
const HeartOfDepth = createCard(312202, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costVoid(3)
  .buildToEquipment()
  .withUsagePerRound(1)
  .on("beforeUseDice", (c) => {
    if (c.useSkillCtx || c.playCardCtx?.isTalentOf(c.getMaster().info.id)) {
      c.deductCost(DiceType.Hydro);
    } else {
      return false;
    }
  })
  .on("rollPhase", (c) => (c.fixDice(DiceType.Hydro, DiceType.Hydro), false))
  .build();

/**
 * **教官的帽子**
 * 角色引发元素反应后：生成1个此角色元素类型的元素骰。（每回合至多3次）
 * （角色最多装备1件「圣遗物」）
 */
const InstructorsCap = createCard(312005, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costVoid(2)
  .buildToEquipment()
  .withUsagePerRound(3)
  .on("elementalReaction", (c) => {
    c.generateDice(c.getMaster().elementType());
  })
  .build();

/**
 * **月桂的宝冠**
 * 角色使用技能或装备「天赋」时：少花费1个草元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const LaurelCoronet = createCard(312701, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costSame(2)
  .buildToEquipment()
  .withUsagePerRound(1)
  .on("beforeUseDice", (c) => {
    if (c.useSkillCtx || c.playCardCtx?.isTalentOf(c.getMaster().info.id)) {
      c.deductCost(DiceType.Dendro);
    } else {
      return false;
    }
  })
  .build();

/**
 * **幸运儿银冠**
 * 角色使用「元素战技」后：治疗自身2点。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const LuckyDogsSilverCirclet = createCard(312002, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costVoid(2)
  .buildToEquipment()
  .withUsagePerRound(1)
  .on("useSkill", (c) => {
    if (c.info.type === "elemental") {
      c.getMaster().heal(2);
    } else {
      return false;
    }
  })
  .build();

/**
 * **不动玄石之相**
 * 角色使用技能或装备「天赋」时：少花费1个岩元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const MaskOfSolitudeBasalt = createCard(312601, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costSame(2)
  .buildToEquipment()
  .withUsagePerRound(1)
  .on("beforeUseDice", (c) => {
    if (c.useSkillCtx || c.playCardCtx?.isTalentOf(c.getMaster().info.id)) {
      c.deductCost(DiceType.Geo);
    } else {
      return false;
    }
  })
  .build();

/**
 * **华饰之兜**
 * 其他我方角色使用「元素爆发」后：所附属角色获得1点充能。
 * （角色最多装备1件「圣遗物」）
 */
const OrnateKabuto = createCard(312007, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costVoid(2)
  .buildToEquipment()
  .listenToOther()
  .on("useSkill", (c) => {
    if (c.info.type !== "burst" && c.character.info.id !== c.getMaster().info.id) {
      c.gainEnergy(1);
    }
  })
  .build();

/**
 * **追忆之注连**
 * 角色使用「元素战技」或装备「天赋」时：少花费1个元素骰。（每回合1次）
 * 如果角色具有至少2点充能，就使角色「普通攻击」和「元素战技」造成的伤害+1。
 * （角色最多装备1件「圣遗物」）
 */
const ShimenawasReminiscence = createCard(312014, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costSame(3)
  .buildToEquipment()
  .withUsagePerRound(1)
  .on("beforeUseDice", (c) => {
    if (c.useSkillCtx?.info.type === "elemental" 
      || c.playCardCtx?.isTalentOf(c.getMaster().info.id)) {
      c.deductCost(DiceType.Void);
    } else {
      return false;
    }
  })
  .on("beforeSkillDamage", (c) => {
    if (c.getMaster().energy >= 2) {
      if (c.skillInfo.type === "normal" || c.skillInfo.type === "elemental") {
        c.addDamage(1);
      }
    }
    return false;
  })
  .build();

/**
 * **千岩牢固**
 * 行动阶段开始时：为角色附属「重嶂不移」。（提供2点护盾，保护该角色。）
 * 角色受到伤害后：如果所附属角色为「出战角色」，则生成1个此角色元素类型的元素骰。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const TenacityOfTheMillelith = createCard(312010, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costSame(3)
  .buildToEquipment()
  .withUsagePerRound(1)
  .on("actionPhase", (c) => (c.createStatus(UnmovableMountain), false))
  .on("damaged", (c) => {
    if (c.getMaster().isActive()) {
      c.generateDice(c.getMaster().elementType());
    } else {
      return false;
    }
  })
  .build();

/**
 * **如雷的盛怒**
 * 角色使用技能或装备「天赋」时：少花费1个雷元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出雷元素。
 * （角色最多装备1件「圣遗物」）
 */
const ThunderingFury = createCard(312402, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costVoid(3)
  .buildToEquipment()
  .withUsagePerRound(1)
  .on("beforeUseDice", (c) => {
    if (c.useSkillCtx || c.playCardCtx?.isTalentOf(c.getMaster().info.id)) {
      c.deductCost(DiceType.Electro);
    } else {
      return false;
    }
  })
  .on("rollPhase", (c) => (c.fixDice(DiceType.Electro, DiceType.Electro), false))
  .build();

/**
 * **虺雷之姿**
 * 角色使用「普通攻击」或装备「天赋」时：少花费1个元素骰。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const ThunderingPoise = createCard(312011, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costSame(2)
  .buildToEquipment()
  .withUsagePerRound(1)
  .on("beforeUseDice", (c) => {
    if (c.useSkillCtx?.info.type === "normal" || 
      c.playCardCtx?.isTalentOf(c.getMaster().info.id)) {
      c.deductCost(DiceType.Void);
    } else {
      return false;
    }
  })
  .build();

/**
 * **唤雷的头冠**
 * 角色使用技能或装备「天赋」时：少花费1个雷元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const ThunderSummonersCrown = createCard(312401, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costSame(2)
  .buildToEquipment()
  .withUsagePerRound(1)
  .on("beforeUseDice", (c) => {
    if (c.useSkillCtx || c.playCardCtx?.isTalentOf(c.getMaster().info.id)) {
      c.deductCost(DiceType.Electro);
    } else {
      return false;
    }
  })
  .build();

/**
 * **游医的方巾**
 * 角色使用「元素爆发」后：治疗所有我方角色1点。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const TravelingDoctorsHandkerchief = createCard(312003, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costSame(1)
  .buildToEquipment()
  .withUsagePerRound(1)
  .on("useSkill", (c) => {
    if (c.info.type === "burst") {
      c.heal(1, Target.myAll());
    } else {
      return false;
    }
  })
  .build();

/**
 * **辰砂往生录（生效中）**
 * 本回合中，角色「普通攻击」造成的伤害+1。
 */
const VermillionHereafterStatus = createStatus(301203)
  .withDuration(1)
  .on("beforeSkillDamage", (c) => c.addDamage(1))
  .build()

/**
 * **辰砂往生录**
 * 角色使用「普通攻击」或装备「天赋」时：少花费1个元素骰。（每回合1次）
 * 角色被切换为「出战角色」后：本回合中，角色「普通攻击」造成的伤害+1。
 * （角色最多装备1件「圣遗物」）
 */
const VermillionHereafter = createCard(312012, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costSame(3)
  .buildToEquipment()
  .withUsagePerRound(1)
  .on("beforeUseDice", (c) => {
    if (c.useSkillCtx?.info.type === "elemental" || 
      c.playCardCtx?.isTalentOf(c.getMaster().info.id)) {
      c.deductCost(DiceType.Void);
    } else {
      return false;
    }
  })
  .on("switchActive", (c) => (c.createStatus(VermillionHereafterStatus), false))
  .build();

/**
 * **翠绿之影**
 * 角色使用技能或装备「天赋」时：少花费1个风元素。（每回合1次）
 * 投掷阶段：2个元素骰初始总是投出风元素。
 * （角色最多装备1件「圣遗物」）
 */
const ViridescentVenerer = createCard(312502, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costVoid(3)
  .buildToEquipment()
  .withUsagePerRound(1)
  .on("beforeUseDice", (c) => {
    if (c.useSkillCtx || c.playCardCtx?.isTalentOf(c.getMaster().info.id)) {
      c.deductCost(DiceType.Anemo);
    } else {
      return false;
    }
  })
  .on("rollPhase", (c) => (c.fixDice(DiceType.Anemo, DiceType.Anemo), false))
  .build();

/**
 * **翠绿的猎人之冠**
 * 角色使用技能或装备「天赋」时：少花费1个风元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const ViridescentVenerersDiadem = createCard(312501, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costSame(2)
  .buildToEquipment()
  .withUsagePerRound(1)
  .on("beforeUseDice", (c) => {
    if (c.useSkillCtx || c.playCardCtx?.isTalentOf(c.getMaster().info.id)) {
      c.deductCost(DiceType.Anemo);
    } else {
      return false;
    }
  })
  .build();

/**
 * **酒渍船帽**
 * 角色使用技能或装备「天赋」时：少花费1个水元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const WinestainedTricorne = createCard(312201, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costSame(2)
  .buildToEquipment()
  .withUsagePerRound(1)
  .on("beforeUseDice", (c) => {
    if (c.useSkillCtx || c.playCardCtx?.isTalentOf(c.getMaster().info.id)) {
      c.deductCost(DiceType.Hydro);
    } else {
      return false;
    }
  })
  .build();

/**
 * **焦灼的魔女帽**
 * 角色使用技能或装备「天赋」时：少花费1个火元素。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const WitchsScorchingHat = createCard(312301, ["character"])
  .setType("equipment")
  .addTags("artifact")
  .costSame(2)
  .buildToEquipment()
  .on("beforeUseDice", (c) => {
    if (c.useSkillCtx || c.playCardCtx?.isTalentOf(c.getMaster().info.id)) {
      c.deductCost(DiceType.Pyro);
    } else {
      return false;
    }
  })
  .build();
