import { DamageType, DiceType, Target, createCard } from '@gi-tcg';

/**
 * **常九爷**
 * 双方角色使用技能后：如果造成了物理伤害、穿透伤害或引发了元素反应，此牌累积1个「灵感」。
 * 如果此牌已累积3个「灵感」，弃置此牌：抓2张牌。
 */
const ChangTheNinth = createCard(322009)
  .setType("support")
  .addTags("ally")
  .buildToSupport()
  .listenToOpp()
  .do({
    onUseSkill(c) {
      const damageCnt = c.getAllDescendingDamages()
        .filter(c => c.damageType === DamageType.Physical || c.damageType === DamageType.Piercing)
        .length;
      const reactionCnt = c.getAllDescendingReactions().length;
      this.inspiration += damageCnt + reactionCnt;
      if (this.inspiration >= 3) {
        c.dispose();
        c.drawCards(2);
      }
    }
  }, {
    inspiration: 0,
  })
  .build();

/**
 * **卯师傅**
 * 打出「料理」事件牌后：生成1个随机基础元素骰。（每回合1次）
 */
const ChefMao = createCard(322005)
  .setType("support")
  .addTags("ally")
  .costSame(1)
  .buildToSupport()
  .withUsagePerRound(1)
  .on("playCard", (c) => {
    if (c.info.tags.includes("food")) {
      c.generateRandomElementDice();
    } else {
      return false;
    }
  })
  .build();

/**
 * **迪娜泽黛**
 * 打出「伙伴」支援牌时：少花费1个元素骰。（每回合1次）
 */
const Dunyarzad = createCard(322016)
  .setType("support")
  .addTags("ally")
  .costSame(1)
  .buildToSupport()
  .withUsagePerRound(1)
  .on("beforeUseDice", (c) => {
    if (c.playCardCtx && c.playCardCtx.info.tags.includes("ally")) {
      c.deductCost(DiceType.Omni, 1);
    } else {
      return false;
    }
  })
  .build();

/**
 * **艾琳**
 * 我方角色使用本回合使用过的技能时：少花费1个元素骰。（每回合1次）
 */
const Ellin = createCard(322010)
  .setType("support")
  .addTags("ally")
  .costSame(2)
  .buildToSupport()
  .do({
    onBeforeUseDice(c) {
      if (c.useSkillCtx && this.skills.includes(c.useSkillCtx.info.id)) {
        c.deductCost(DiceType.Omni);
      } else {
        return false;
      }
    },
    onUseSkill(c) {
      this.skills.push(c.info.id);
      return false;
    }
  }, { skills: [] as number[] })
  .build();

/**
 * **花散里**
 * 召唤物消失时：此牌累积1点「大祓」进度。（最多累积3点）
 * 我方打出「武器」或「圣遗物」装备时：如果「大祓」进度已达到3，则弃置此牌，使打出的卡牌少花费2个元素骰。
 */
const Hanachirusato = createCard(322013)
  .setType("support")
  .addTags("ally")
  .buildToSupport()
  // TODO
  .build();

/**
 * **田铁嘴**
 * 结束阶段：我方一名充能未满的角色获得1点充能。（出战角色优先）
 * 可用次数：2
 */
const IronTongueTian = createCard(322011)
  .setType("support")
  .addTags("ally")
  .costVoid(2)
  .buildToSupport()
  .withUsage(2)
  .on("endPhase", (c) => !!c.gainEnergy(1, Target.oneEnergyNotFull()))
  .build();
// TODO: 确认：如果所有角色充能已满，是否扣除可用次数

/**
 * **凯瑟琳**
 * 我方执行「切换角色」行动时：将此次切换视为「快速行动」而非「战斗行动」。（每回合1次）
 */
const Katheryne = createCard(322002)
  .setType("support")
  .addTags("ally")
  .costSame(1)
  .buildToSupport()
  .withUsagePerRound(1)
  .on("requestFastSwitchActive", () => true)
  .build();

/**
 * **鲸井小弟**
 * 行动阶段开始时：生成1点万能元素。然后，如果对方的支援区未满，则将此牌转移到对方的支援区。
 */
const KidKujirai = createCard(322014)
  .setType("support")
  .addTags("ally")
  .buildToSupport()
  .on("actionPhase", (c) => {
    c.generateDice(DiceType.Omni);
    if (c.fullSupportArea(true)) {
      c.createSupport(KidKujirai, true);
      c.dispose();
    }
  })
  .build();

/**
 * **立本**
 * 结束阶段：收集我方未使用的元素骰（每种最多1个）。
 * 行动阶段开始时：如果此牌已收集3个元素骰，则抓2张牌，生成2点万能元素，然后弃置此牌。
 */
const Liben = createCard(322008)
  .setType("support")
  .addTags("ally")
  .buildToSupport()
  // TODO
  .build();

/**
 * **刘苏**
 * 我方切换角色后：如果切换到的角色没有充能，则使该角色获得1点充能。（每回合1次）
 * 可用次数：2
 */
const LiuSu = createCard(322012)
  .setType("support")
  .addTags("ally")
  .costSame(1)
  .buildToSupport()
  .withUsage(2)
  .withUsagePerRound(1)
  .on("switchActive", (c) => {
    if (c.to.energy === 0) {
      c.to.gainEnergy(1);
    } else {
      return false;
    }
  })
  .build();

/**
 * **派蒙**
 * 行动阶段开始时：生成2点万能元素。
 * 可用次数：2
 */
const Paimon = createCard(322001)
  .setType("support")
  .addTags("ally")
  .costSame(3)
  .buildToSupport()
  .withUsage(2)
  .on("actionPhase", (c) => c.generateDice(DiceType.Omni, DiceType.Omni))
  .build();

/**
 * **拉娜**
 * 我方角色使用「元素战技」后：生成1个我方下一个后台角色类型的元素骰。（每回合1次）
 */
const Rana = createCard(322017)
  .setType("support")
  .addTags("ally")
  .costSame(2)
  .buildToSupport()
  .on("useSkill", (c) => {
    if (c.info.type === "elemental") {
      const next = c.hasCharacter(Target.myNext());
      if (next) {
        c.generateDice(next.elementType());
      }
    }
  })
  .build();

/**
 * **蒂玛乌斯**
 * 入场时附带2个「合成材料」。
 * 结束阶段：补充1个「合成材料」。
 * 打出「圣遗物」手牌时：如可能，则支付等同于「圣遗物」总费用数量的「合成材料」，以免费装备此「圣遗物」。（每回合1次）
 */
const Timaeus = createCard(322003)
  .setType("support")
  .addTags("ally")
  .costSame(2)
  .buildToSupport()
  // TODO
  .build();

/**
 * **提米**
 * 每回合自动触发1次：此牌累积1只「鸽子」。
 * 如果此牌已累积3只「鸽子」，则弃置此牌：抓1张牌，生成一点万能元素。
 */
const Timmie = createCard(322007)
  .setType("support")
  .addTags("ally")
  .buildToSupport()
  .do({
    onActionPhase(c) {
      this.penguin++;
      if (this.penguin >= 3) {
        c.dispose();
        c.drawCards(1);
        c.generateDice(DiceType.Omni);
      }
    }
  }, { penguin: 1 })
  .build();

/**
 * **阿圆**
 * 打出「场地」支援牌时：少花费2个元素骰。（每回合1次）
 */
const Tubby = createCard(322006)
  .setType("support")
  .addTags("ally")
  .costSame(2)
  .buildToSupport()
  .withUsagePerRound(1)
  .on("beforeUseDice", (c) => {
    if (c.playCardCtx && c.playCardCtx.info.tags.includes("place")) {
      c.deductCost(DiceType.Omni, 2);
    } else {
      return false;
    }
  })
  .build();

/**
 * **瓦格纳**
 * 入场时附带2个「锻造原胚」。
 * 结束阶段：补充1个「锻造原胚」。
 * 打出「武器」手牌时：如可能，则支付等同于「武器」总费用数量的「锻造原胚」，以免费装备此「武器」。（每回合1次）
 */
const Wagner = createCard(322004)
  .setType("support")
  .addTags("ally")
  .costSame(2)
  .buildToSupport()
  // TODO
  .build();

/**
 * **旭东**
 * 打出「料理」事件牌时：少花费2个元素骰。（每回合1次）
 */
const Xudong = createCard(322015)
  .setType("support")
  .addTags("ally")
  .costVoid(2)
  .buildToSupport()
  .withUsagePerRound(1)
  .on("beforeUseDice", (c) => {
    if (c.playCardCtx && c.playCardCtx.info.tags.includes("food")) {
      c.deductCost(DiceType.Omni, 2);
    }
  })
  .build();

/** 
 * **老章** 
 * 我方打出「武器」手牌时：少花费1个元素骰；我方场上每有一个已装备「武器」的角色，就额外少花费1个元素骰。（每回合1次）
 */
const MasterZhang = createCard(-33)
  .setType("support")
  .addTags("ally")
  .costVoid(1)
  .buildToSupport()
  .withUsagePerRound(1)
  .on("beforeUseDice", (c) => {
    if (c.playCardCtx?.isWeapon()) {
      const hasWeaponChar = c.allCharacters().filter(ch => ch.hasEquipment("weapon")).length;
      const deduct = new Array(hasWeaponChar + 1).fill(DiceType.Omni);
      c.deductCost(...deduct);
    } else {
      return false;
    }
  })
  .build();

