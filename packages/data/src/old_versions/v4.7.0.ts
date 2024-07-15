import { Aura, CardHandle, DamageType, DiceType, card, combatStatus, diceCostOfCard, skill, status, summon } from "@gi-tcg/core/builder";
import { BonecrunchersEnergyBlockCombatStatus } from "../cards/event/other";
import { LingeringIcicles } from "../characters/cryo/wriothesley";
import { ShieldOfPassion } from "../characters/pyro/xinyan";
import { Cyno } from "../characters/electro/cyno";
import { LightningRoseSummon } from "../characters/electro/lisa";
import { DominusLapidisStrikingStone, Zhongli } from "../characters/geo/zhongli";
import { AutumnWhirlwind } from "../characters/anemo/kaedehara_kazuha";
import { AbiogenesisSolarIsotoma, Albedo } from "../characters/geo/albedo";
import { YunJin } from "../characters/geo/yun_jin";
import { DendroCore } from "../commons";
import { BountifulCore } from "../characters/hydro/nilou";
import { MehraksAssistance, TheArtOfBudgeting, TheArtOfBudgetingInEffect } from "../characters/dendro/kaveh";
import { MirrorMaiden } from "../characters/hydro/mirror_maiden";
import { InfluxBlast } from "./v3.6.0";
import { AlldevouringNarwhal, AnomalousAnatomy, DarkShadow, LightlessFeeding } from "../characters/hydro/alldevouring_narwhal";
import { ThunderboreTrap } from "../characters/electro/consecrated_scorpion";
import { BonecrunchersEnergyBlockAccumulated } from "../characters/anemo/consecrated_flying_serpent";
import { AwakenMyKindred, OasisNourishment } from "../characters/dendro/guardian_of_apeps_oasis";

/**
 * @id 311207
 * @name 竭泽
 * @description
 * 我方打出名称不存在于初始牌组中的行动牌后：此牌累积1点「渔猎」。（最多累积2点，每回合最多累积2点）
 * 角色使用技能时：如果此牌已有「渔猎」，则消耗所有「渔猎」，使此技能伤害+1，并且每消耗1点「渔猎」就抓1张牌。
 * （「弓」角色才能装备。角色最多装备1件「武器」）
 */
const EndOfTheLine = card(311207)
  .until("v4.7.0")
  .costSame(2)
  .weapon("bow")
  .variable("fishing", 0)
  .variable("additivePerRound", 0, { visible: false })
  .on("roundBegin")
  .setVariable("additivePerRound", 0)
  .on("playCard", (c, e) => !c.player.initialPiles.find((def) => e.card.definition.id === def.id))
  .do((c) => {
    if (c.getVariable("additivePerRound") < 2) {
      c.addVariableWithMax("fishing", 1, 2);
      c.addVariable("additivePerRound", 1);
    }
  })
  .on("modifySkillDamage")
  .do((c, e) => {
    const fishing = c.getVariable("fishing");
    if (fishing > 0) {
      e.increaseDamage(1)
      c.drawCards(fishing);
      c.setVariable("fishing", 0);
    }
  })
  .done();

/**
 * @id 332001
 * @name 最好的伙伴！
 * @description
 * 将所花费的元素骰转换为2个万能元素。
 */
const TheBestestTravelCompanion = card(332001)
  .until("v4.7.0")
  .costVoid(2)
  .generateDice(DiceType.Omni, 2)
  .done();

/**
 * @id 321004
 * @name 晨曦酒庄
 * @description
 * 我方执行「切换角色」行动时：少花费1个元素骰。（每回合1次）
 */
const DawnWinery = card(321004)
  .until("v4.7.0")
  .costSame(2)
  .support("place")
  .on("deductOmniDiceSwitch")
  .usagePerRound(1)
  .deductOmniCost(1)
  .done();

/**
 * @id 323008
 * @name 苦舍桓
 * @description
 * 行动阶段开始时：舍弃最多2张元素骰费用最高的手牌，每舍弃1张，此牌就累积1点「记忆和梦」。（最多2点）
 * 我方角色使用技能时：如果我方本回合未打出过行动牌，则消耗1点「记忆和梦」，以使此技能少花费1个元素骰。
 */
const Kusava = card(323008)
  .until("v4.7.0")
  .support("item")
  .variable("memory", 0)
  .variable("cardPlayed", 0, { visible: false })
  .on("roundBegin")
  .do((c) => {
    const cards = c.randomN(c.getMaxCostHands(), 2);
    const count = cards.length;
    c.disposeCard(...cards);
    c.addVariableWithMax("memory", count, 2);
    c.setVariable("cardPlayed", 0)
  })
  .on("playCard")
  .setVariable("cardPlayed", 1)
  .on("deductOmniDiceSkill", (c, e) => !c.getVariable("cardPlayed") && c.getVariable("memory") > 0)
  .deductOmniCost(1)
  .addVariable("memory", -1)
  .done();

/**
 * @id 332024
 * @name 琴音之诗
 * @description
 * 将一个我方角色所装备的「圣遗物」返回手牌。
 * 本回合中，我方下次打出「圣遗物」手牌时：少花费2个元素骰。
 */
const Lyresong = card(332024)
  .until("v4.7.0")
  .addTarget("my character has equipment with tag (artifact)")
  .do((c, e) => {
    const { definition } = c.of(e.targets[0]).removeArtifact()!;
    c.createHandCard(definition.id as CardHandle);
  })
  .toCombatStatus(303224)
  .oneDuration()
  .once("deductOmniDiceCard", (c, e) => e.hasCardTag("artifact"))
  .deductOmniCost(2)
  .done();

/**
 * @id 321021
 * @name 中央实验室遗址
 * @description
 * 我方舍弃或调和1张牌后：此牌累积1点「实验进展」。每当「实验进展」达到3点、6点、9点时，就获得1个万能元素骰。然后，如果「实验进展」至少为9点，则弃置此牌。
 */
const CentralLaboratoryRuins = card(321021)
  .until("v4.7.0")
  .costSame(1)
  .support("place")
  .variable("progress", 0)
  .on("disposeOrTuneCard")
  .do((c) => {
    c.addVariable("progress", 1);
    const progress = c.getVariable("progress");
    if (progress % 3 === 0) {
      c.generateDice(DiceType.Omni, 1);
    }
    if (progress >= 9) {
      c.dispose();
    }
  })
  .done();

/**
 * @id 303230
 * @name 海底宝藏
 * @description
 * 治疗我方出战角色1点，生成1个随机基础元素骰。
 */
const UnderseaTreasure = card(303230)
  .until("v4.7.0")
  .heal(1, "my active")
  .generateDice("randomElement", 1)
  .done();

/**
 * @id 124051
 * @name 噬骸能量块
 * @description
 * 随机舍弃1张原本元素骰费用最高的手牌，生成1个我方出战角色类型的元素骰。如果我方出战角色是「圣骸兽」角色，则使其获得1点充能。（每回合最多打出1张）
 */
const BonecrunchersEnergyBlock = card(124051)
  .until("v4.7.0")
  .filter((c) => !c.$(`my combat status with definition id ${BonecrunchersEnergyBlockCombatStatus}`))
  .do((c) => {
    const hands = c.getMaxCostHands();
    const selected = c.random(hands);
    c.disposeCard(selected);
    const activeCh = c.$("my active")!;
    c.generateDice(activeCh.element(), 1);
    if (activeCh.definition.tags.includes("sacread")) {
      c.gainEnergy(1, activeCh.state);
    }
    c.combatStatus(BonecrunchersEnergyBlockCombatStatus)
  })
  .done();

/**
 * @id 111111
 * @name 寒烈的惩裁
 * @description
 * 角色进行普通攻击时：如果角色生命至少为6，则此技能少花费1个冰元素，伤害+1，且对自身造成1点穿透伤害。
 * 如果角色生命不多于5，则使此伤害+1，并且技能结算后治疗角色2点。
 * 可用次数：2
 */
const ChillingPenalty = status(111111)
  .until("v4.7.0")
  .variable("healAfterUseSkill", 0, { visible: false })
  .on("deductElementDiceSkill", (c, e) => c.self.master().health >= 6 &&
    e.isSkillType("normal") && 
    e.canDeductCostOfType(DiceType.Cryo))
  .deductCost(DiceType.Cryo, 1)
  .on("modifySkillDamage", (c, e) => e.viaSkillType("normal"))
  .usage(2)
  .do((c, e) => {
    if (c.self.master().health >= 6) {
      e.increaseDamage(1);
      c.damage(DamageType.Piercing, 1, "@master");
    } else /* if (c.self.master().health <= 5) */ {
      e.increaseDamage(1);
      c.setVariable("healAfterUseSkill", 1);
    }
  })
  .on("useSkill", (c) => c.getVariable("healAfterUseSkill"))
  .heal(2, "@master")
  .setVariable("healAfterUseSkill", 0)
  .done();

/**
 * @id 11113
 * @name 黑金狼噬
 * @description
 * 造成2点冰元素伤害，生成余威冰锥。
 * 本角色在本回合中受到伤害或治疗每累计到2次时：此技能少花费1个元素骰（最多少花费2个）。
 */
const DarkgoldWolfbite = skill(11113)
  .until("v4.7.0")
  .type("burst")
  .costCryo(3)
  .costEnergy(3)
  .damage(DamageType.Cryo, 2)
  .combatStatus(LingeringIcicles)
  .done();

/**
 * @id 12121
 * @name 独舞之邀
 * @description
 * 造成2点物理伤害。
 * 每回合1次：：生成手牌圣俗杂座。
 */
const SoloistsSolicitationOusia = skill(12121)
  .until("v4.7.0")
  .type("normal")
  .costHydro(1)
  .costVoid(2)
  .damage(DamageType.Physical, 2)
  .done();

/**
 * @id 13122
 * @name 热情拂扫
 * @description
 * 造成2点火元素伤害，随机舍弃1张原本元素骰费用最高的手牌，生成热情护盾。
 */
const SweepingFervor = skill(13122)
  .until("v4.7.0")
  .type("elemental")
  .costPyro(3)
  .damage(DamageType.Pyro, 2)
  .do((c) => {
    const cards = c.getMaxCostHands();
    c.disposeCard(c.random(cards));
  })
  .combatStatus(ShieldOfPassion)
  .done();

/**
 * @id 114041
 * @name 启途誓使
 * @description
 * 结束阶段：累积1级「凭依」。
 * 根据「凭依」级数，提供效果：
 * 大于等于2级：物理伤害转化为雷元素伤害；
 * 大于等于4级：造成的伤害+2；
 * 大于等于6级时：「凭依」级数-4。
 */
const PactswornPathclearer = status(114041)
  .until("v4.7.0")
  .variable("reliance", 0)
  .on("endPhase")
  .do((c) => {
    const newVal = c.getVariable("reliance") + 1;
    if (newVal >= 6) {
      c.setVariable("reliance", newVal - 4);
    } else {
      c.setVariable("reliance", newVal);
    }
  })
  .on("modifySkillDamageType", (c, e) => c.getVariable("reliance") >= 2 && e.type === DamageType.Physical)
  .changeDamageType(DamageType.Electro)
  .on("modifySkillDamage", (c, e) => c.getVariable("reliance") >= 4)
  .increaseDamage(2)
  .done();

/**
 * @id 14042
 * @name 秘仪·律渊渡魂
 * @description
 * 造成3点雷元素伤害。
 */
const SecretRiteChasmicSoulfarer = skill(14042)
  .until("v4.7.0")
  .type("elemental")
  .costElectro(3)
  .damage(DamageType.Electro, 3)
  .done();

/**
 * @id 14043
 * @name 圣仪·煟煌随狼行
 * @description
 * 造成4点雷元素伤害，
 * 启途誓使的[凭依]级数+2。
 */
const SacredRiteWolfsSwiftness = skill(14043)
  .until("v4.7.0")
  .type("burst")
  .costElectro(4)
  .costEnergy(2)
  .damage(DamageType.Electro, 4)
  .do((c) => {
    const status = c.self.hasStatus(PactswornPathclearer)!;
    const newVal = c.getVariable("reliance", status) + 2;
    if (newVal >= 6) {
      c.setVariable("reliance", newVal - 4, status);
    } else {
      c.setVariable("reliance", newVal, status);
    }
  })
  .done();

/**
 * @id 214041
 * @name 落羽的裁择
 * @description
 * 战斗行动：我方出战角色为赛诺时，装备此牌。
 * 赛诺装备此牌后，立刻使用一次秘仪·律渊渡魂。
 * 装备有此牌的赛诺在启途誓使的「凭依」级数为偶数时，使用秘仪·律渊渡魂造成的伤害+1。
 * （牌组中包含赛诺，才能加入牌组）
 */
const FeatherfallJudgment = card(214041)
  .until("v4.7.0")
  .costElectro(3)
  .talent(Cyno)
  .on("enter")
  .useSkill(SecretRiteChasmicSoulfarer)
  .on("modifySkillDamage", (c, e) => {
    const status = c.self.master().hasStatus(PactswornPathclearer)!;
    return c.getVariable("reliance", status) % 2 === 0 && e.via.definition.id === SecretRiteChasmicSoulfarer;
  })
  .increaseDamage(1)
  .done();

/**
 * @id 14093
 * @name 蔷薇的雷光
 * @description
 * 造成2点雷元素伤害，召唤蔷薇雷光。
 */
const LightningRose = skill(14093)
  .until("v4.7.0")
  .type("burst")
  .costElectro(3)
  .costEnergy(2)
  .damage(DamageType.Electro, 2)
  .summon(LightningRoseSummon)
  .done();

/**
 * @id 115051
 * @name 乱岚拨止
 * @description
 * 所附属角色进行下落攻击时：造成的物理伤害变为风元素伤害，且伤害+1。
 * 角色使用技能后：移除此效果。
 */
const MidareRanzan = status(115051)
  .until("v4.7.0")
  .on("modifySkillDamageType", (c, e) => e.viaPlungingAttack())
  .changeDamageType(DamageType.Anemo)
  .increaseDamage(1)
  .on("useSkill")
  .dispose()
  .done();

/**
 * @id 115053
 * @name 乱岚拨止·冰
 * @description
 * 所附属角色进行下落攻击时：造成的物理伤害变为冰元素伤害，且伤害+1。
 * 所附属角色使用技能后：移除此效果。
 */
const MidareRanzanCryo = status(115053)
  .until("v4.7.0")
  .on("modifySkillDamageType", (c, e) => e.viaPlungingAttack())
  .changeDamageType(DamageType.Cryo)
  .increaseDamage(1)
  .on("useSkill")
  .dispose()
  .done();

/**
 * @id 115056
 * @name 乱岚拨止·雷
 * @description
 * 所附属角色进行下落攻击时：造成的物理伤害变为雷元素伤害，且伤害+1。
 * 所附属角色使用技能后：移除此效果。
 */
const MidareRanzanElectro = status(115056)
  .until("v4.7.0")
  .on("modifySkillDamageType", (c, e) => e.viaPlungingAttack())
  .changeDamageType(DamageType.Electro)
  .increaseDamage(1)
  .on("useSkill")
  .dispose()
  .done();

/**
 * @id 115054
 * @name 乱岚拨止·水
 * @description
 * 所附属角色进行下落攻击时：造成的物理伤害变为水元素伤害，且伤害+1。
 * 所附属角色使用技能后：移除此效果。
 */
const MidareRanzanHydro = status(115054)
  .until("v4.7.0")
  .on("modifySkillDamageType", (c, e) => e.viaPlungingAttack())
  .changeDamageType(DamageType.Hydro)
  .increaseDamage(1)
  .on("useSkill")
  .dispose()
  .done();

/**
 * @id 115055
 * @name 乱岚拨止·火
 * @description
 * 所附属角色进行下落攻击时：造成的物理伤害变为火元素伤害，且伤害+1。
 * 所附属角色使用技能后：移除此效果。
 */
const MidareRanzanPyro = status(115055)
  .until("v4.7.0")
  .on("modifySkillDamageType", (c, e) => e.viaPlungingAttack())
  .changeDamageType(DamageType.Pyro)
  .increaseDamage(1)
  .on("useSkill")
  .dispose()
  .done();

/**
 * @id 15052
 * @name 千早振
 * @description
 * 造成3点风元素伤害，本角色附属乱岚拨止。
 * 如果此技能引发了扩散，则将乱岚拨止转换为被扩散的元素。
 * 此技能结算后：我方切换到后一个角色。
 */
const Chihayaburu = skill(15052)
  .until("v4.7.0")
  .type("elemental")
  .costAnemo(3)
  .do((c) => {
    const aura = c.$("opp active")!.aura;
    let midareRanzan;
    switch (aura) {
      case Aura.Cryo:
      case Aura.CryoDendro:
        midareRanzan = MidareRanzanCryo;
        break;
      case Aura.Electro:
        midareRanzan = MidareRanzanElectro;
        break;
      case Aura.Hydro:
        midareRanzan = MidareRanzanHydro;
        break;
      case Aura.Pyro:
        midareRanzan = MidareRanzanPyro;
        break;
      default:
        midareRanzan = MidareRanzan;
        break;
    }
    c.characterStatus(midareRanzan);
  })
  .damage(DamageType.Anemo, 3)
  .done();

/**
 * @id 15053
 * @name 万叶之一刀
 * @description
 * 造成3点风元素伤害，召唤流风秋野。
 */
const KazuhaSlash = skill(15053)
  .until("v4.7.0")
  .type("burst")
  .costAnemo(3)
  .costEnergy(2)
  .damage(DamageType.Anemo, 3)
  .summon(AutumnWhirlwind)
  .done();

/**
 * @id 216031
 * @name 炊金馔玉
 * @description
 * 战斗行动：我方出战角色为钟离时，装备此牌。
 * 钟离装备此牌后，立刻使用一次地心·磐礴。
 * 我方出战角色在护盾角色状态或护盾出战状态的保护下时，我方召唤物造成的岩元素伤害+1。
 * （牌组中包含钟离，才能加入牌组）
 */
const DominanceOfEarth = card(216031)
  .until("v4.7.0")
  .costGeo(5)
  .talent(Zhongli)
  .on("enter")
  .useSkill(DominusLapidisStrikingStone)
  .on("modifyDamage", (c, e) => {
    return e.type === DamageType.Geo &&
      e.source.definition.type === "summon" &&
      !!c.$(`(my combat status with tag (shield)) or (status with tag (shield) at my active)`);
  })
  .increaseDamage(1)
  .done();

/**
 * @id 116041
 * @name 阳华
 * @description
 * 结束阶段：造成1点岩元素伤害。
 * 可用次数：3
 * 此召唤物在场时：我方角色进行下落攻击时少花费1个无色元素。（每回合1次）
 */
const SolarIsotoma = summon(116041)
  .until("v4.7.0")
  .endPhaseDamage(DamageType.Geo, 1)
  .usage(3)
  .on("deductVoidDiceSkill", (c, e) => e.isPlungingAttack())
  .usagePerRound(1)
  .deductVoidCost(1)
  .done();

/**
 * @id 216041
 * @name 神性之陨
 * @description
 * 战斗行动：我方出战角色为阿贝多时，装备此牌。
 * 阿贝多装备此牌后，立刻使用一次创生法·拟造阳华。
 * 装备有此牌的阿贝多在场时，如果我方场上存在阳华，则我方角色进行下落攻击时造成的伤害+1。
 * （牌组中包含阿贝多，才能加入牌组）
 */
const DescentOfDivinity = card(216041)
  .until("v4.7.0")
  .costGeo(3)
  .talent(Albedo)
  .on("enter")
  .useSkill(AbiogenesisSolarIsotoma)
  .on("modifySkillDamage", (c, e) =>
    c.$(`my summons with definition id ${SolarIsotoma}`) &&
    e.viaPlungingAttack())
  .listenToPlayer()
  .increaseDamage(1)
  .done();

/**
 * @id 116073
 * @name 飞云旗阵
 * @description
 * 我方角色进行普通攻击时：造成的伤害+1。
 * 如果我方手牌数量不多于1，则此技能少花费1个元素骰。
 * 可用次数：1（可叠加，最多叠加到4次）
 */
const FlyingCloudFlagFormation = combatStatus(116073)
  .until("v4.7.0")
  .on("deductOmniDiceSkill", (c, e) => e.isSkillType("normal") && c.player.hands.length <= 1)
  .deductOmniCost(1)
  .on("modifySkillDamage", (c, e) => e.viaSkillType("normal"))
  .usageCanAppend(1, 4)
  .do((c, e) => {
    if (c.$(`my equipment with definition id ${DecorousHarmony}`) && c.player.hands.length === 0) {
      e.increaseDamage(3);
    } else {
      e.increaseDamage(1);
    }
  })
  .done();

/**
 * @id 16073
 * @name 破嶂见旌仪
 * @description
 * 造成2点岩元素伤害，生成3层飞云旗阵。
 */
const CliffbreakersBanner = skill(16073)
  .until("v4.7.0")
  .type("burst")
  .costGeo(3)
  .costEnergy(2)
  .damage(DamageType.Geo, 2)
  .combatStatus(FlyingCloudFlagFormation, "my", {
    overrideVariables: { usage: 3 }
  })
  .done();

/**
 * @id 216071
 * @name 庄谐并举
 * @description
 * 战斗行动：我方出战角色为云堇时，装备此牌。
 * 云堇装备此牌后，立刻使用一次破嶂见旌仪。
 * 装备有此牌的云堇在场时，如果我方没有手牌，则飞云旗阵会使普通攻击造成的伤害额外+2。
 * （牌组中包含云堇，才能加入牌组）
 */
const DecorousHarmony = card(216071)
  .until("v4.7.0")
  .costGeo(3)
  .costEnergy(2)
  .talent(YunJin)
  .on("enter")
  .useSkill(CliffbreakersBanner)
  .done();

/**
 * @id 117082
 * @name 迸发扫描
 * @description
 * 双方选择行动前：如果我方场上存在草原核或丰穰之核，则使其可用次数-1，并舍弃我方牌库顶的1张卡牌。然后，造成所舍弃卡牌原本元素骰费用+1的草元素伤害。
 * 可用次数：1（可叠加，最多叠加到3次）
 */
const BurstScan = combatStatus(117082)
  .until("v4.7.0")
  .on("beforeAction")
  .usage(1, { append: { limit: 3 }, autoDecrease: false })
  .usagePerRound(1, { autoDecrease: false })
  .listenToAll()
  .do((c) => {
    const core = c.$(`my combat status with definition id ${DendroCore} or my summon with definition id ${BountifulCore}`);
    if (core) {
      core.addVariable("usage", -1);
      const pileTop = c.player.piles[0];
      const cost = diceCostOfCard(pileTop.definition);
      c.disposeCard(pileTop);
      c.damage(DamageType.Dendro, cost + 1);
      if (c.$(`my equipment with definition id ${TheArtOfBudgeting}`)) {
        c.createHandCard(pileTop.definition.id as CardHandle);
        if (pileTop.definition.tags.includes("place")) {
          c.combatStatus(TheArtOfBudgetingInEffect);
        }
        c.consumeUsagePerRound();
      }
      c.consumeUsage();
    }
  })
  .done();

/**
 * @id 17083
 * @name 繁绘隅穹
 * @description
 * 造成3点草元素伤害，本角色附属梅赫拉克的助力，生成2层迸发扫描。
 */
const PaintedDome = skill(17083)
  .until("v4.7.0")
  .type("burst")
  .costDendro(3)
  .costEnergy(2)
  .damage(DamageType.Dendro, 3)
  .characterStatus(MehraksAssistance, "@self")
  .combatStatus(BurstScan, "my", {
    overrideVariables: { usage: 2 }
  })
  .done();

/**
 * @id 122022
 * @name 水光破镜
 * @description
 * 所附属角色受到的水元素伤害+1。
 * 所附属角色切换到其他角色时，元素骰费用+1。
 * 持续回合：3
 * （同一方场上最多存在一个此状态）
 */
const Refraction01 = status(122022)
  .until("v4.7.0")
  .conflictWith(122021)
  .unique(122021)
  .duration(3)
  .on("beforeDamaged", (c, e) => e.type === DamageType.Hydro)
  .increaseDamage(1)
  .on("addDice", (c, e) => e.action.type === "switchActive" && c.self.master().id === e.action.from.id)
  .addCost(DiceType.Void, 1)
  .done();

/**
 * @id 122021
 * @name 水光破镜
 * @description
 * 所附属角色受到的水元素伤害+1。
 * 持续回合：2
 * （同一方场上最多存在一个此状态）
 */
const Refraction = status(122021)
  .until("v4.7.0")
  .conflictWith(122022)
  .unique(122022)
  .duration(2)
  .on("beforeDamaged", (c, e) => e.type === DamageType.Hydro)
  .increaseDamage(1)
  .done();

/**
 * @id 222021
 * @name 镜锢之笼
 * @description
 * 战斗行动：我方出战角色为愚人众·藏镜仕女时，装备此牌。
 * 愚人众·藏镜仕女装备此牌后，立刻使用一次潋波绽破。
 * 装备有此牌的愚人众·藏镜仕女生成的水光破镜获得以下效果：
 * 初始持续回合+1，并且会使所附属角色切换到其他角色时元素骰费用+1。
 * （牌组中包含愚人众·藏镜仕女，才能加入牌组）
 */
const MirrorCage = card(222021)
  .until("v4.7.0")
  .costHydro(3)
  .talent(MirrorMaiden)
  .on("enter")
  .useSkill(InfluxBlast)
  .done();

/**
 * @id 122041
 * @name 深噬之域
 * @description
 * 我方舍弃或调和的手牌，会被吞噬。
 * 每吞噬3张牌：吞星之鲸获得1点额外最大生命；如果其中存在原本元素骰费用值相同的牌，则额外获得1点；如果3张均相同，再额外获得1点。
 */
const DeepDevourersDomain = combatStatus(122041)
  .until("v4.7.0")
  .variable("cardCount", 0)
  .variable("totalMaxCost", 0, { visible: false })
  .variable("totalMaxCostCount", 0, { visible: false })
  .variable("card0Cost", 0, { visible: false })
  .variable("card1Cost", 0, { visible: false })
  .on("disposeOrTuneCard")
  .do((c, e) => {
    const cost = e.diceCost();
    c.addVariable("cardCount", 1);
    switch (c.getVariable("cardCount")) {
      case 1: {
        c.setVariable("card0Cost", cost);
        break;
      }
      case 2: {
        c.setVariable("card1Cost", cost);
        break;
      }
      case 3: {
        const card0Cost = c.getVariable("card0Cost");
        const card1Cost = c.getVariable("card1Cost");
        const card2Cost = cost;
        const distinctCostCount = new Set([card0Cost, card1Cost, card2Cost]).size;
        const extraMaxHealth = 4 - distinctCostCount;
        const narwhal = c.$(`my character with definition id ${AlldevouringNarwhal}`);
        if (narwhal) {
          for (let i = 0; i < extraMaxHealth; i++) {
            narwhal.addStatus(AnomalousAnatomy);
          }
        }
        c.setVariable("cardCount", 0);
        break;
      }
    }
    const previousTotalMaxCost = c.getVariable("totalMaxCost");
    if (cost === previousTotalMaxCost) {
      c.addVariable("totalMaxCostCount", 1);
    } else if (cost > previousTotalMaxCost) {
      c.setVariable("totalMaxCost", cost);
      c.setVariable("totalMaxCostCount", 1);
    }
  })
  .done();

/**
 * @id 22042
 * @name 迸落星雨
 * @description
 * 造成2点水元素伤害，此角色每有3点无尽食欲提供的额外最大生命，此伤害+1（最多+5）。然后舍弃1张原本元素骰费用最高的手牌。
 */
const StarfallShower = skill(22042)
  .until("v4.7.0")
  .type("elemental")
  .costHydro(3)
  .do((c) => {
    const st = c.self.hasStatus(AnomalousAnatomy);
    const extraDmg = st ? Math.floor(c.of(st).getVariable("extraMaxHealth") / 3) : 0;
    c.damage(DamageType.Hydro, 2 + extraDmg);
    const cards = c.getMaxCostHands();
    const card = c.random(cards);
    c.disposeCard(card);
    if (c.self.hasEquipment(LightlessFeeding)) {
      c.heal(diceCostOfCard(card.definition), "@self");
    }
  })
  .done();

/**
 * @id 22043
 * @name 横噬鲸吞
 * @description
 * 造成1点水元素伤害，对敌方所有后台角色造成1点穿透伤害。召唤黑色幻影。
 */
const RavagingDevourer = skill(22043)
  .until("v4.7.0")
  .type("burst")
  .costHydro(3)
  .costEnergy(2)
  .damage(DamageType.Piercing, 1, "opp standby")
  .damage(DamageType.Hydro, 1)
  .summon(DarkShadow)
  .done();

/**
 * @id 24052
 * @name 蝎尾锥刺
 * @description
 * 造成3点雷元素伤害。
 * 生成1张噬骸能量块，随机置入我方牌库顶部2张牌之中。
 */
const StingingSpine = skill(24052)
  .until("v4.7.0")
  .type("elemental")
  .costElectro(3)
  .damage(DamageType.Electro, 3)
  .createPileCards(BonecrunchersEnergyBlock, 1, "topRange2")
  .done();

/**
 * @id 24053
 * @name 雷锥散射
 * @description
 * 造成3点雷元素伤害，舍弃手牌中最多3张噬骸能量块，在对方场上生成雷锥陷阱。
 */
const ThunderboreBlast = skill(24053)
  .until("v4.7.0")
  .type("burst")
  .costElectro(3)
  .costEnergy(2)
  .do((c) => {
    c.damage(DamageType.Electro, 3);
    const all = c.player.hands.filter((card) => card.definition.id === BonecrunchersEnergyBlock);
    const cards = c.randomN(all, 3);
    c.disposeCard(...cards);
    c.combatStatus(ThunderboreTrap, "opp", {
      overrideVariables: { usage: cards.length }
    });
  })
  .done();

/**
 * @id 25032
 * @name 盘绕风引
 * @description
 * 造成2点风元素伤害，抓1张噬骸能量块；然后，手牌中每有1张噬骸能量块，抓1张牌（每回合最多抓2张)。
 */
const SwirlingSquall = skill(25032)
  .until("v4.7.0")
  .type("elemental")
  .costAnemo(3)
  .do((c) => {
    c.damage(DamageType.Anemo, 2);
    c.drawCards(1, { withDefinition: BonecrunchersEnergyBlock });
    const cards = c.player.hands.filter((card) => card.definition.id === BonecrunchersEnergyBlock);
    const drawn = c.self.getVariable("elementalSkillDrawCardsCount");
    const count = Math.min(cards.length, 2 - drawn);
    c.drawCards(count);
    c.self.addVariable("elementalSkillDrawCardsCount", count);
  })
  .done();

/**
 * @id 25033
 * @name 错落风涡
 * @description
 * 造成2点风元素伤害，舍弃手牌中所有的噬骸能量块，每舍弃2张，此次伤害翻倍1次。
 */
const ScattershotVortex = skill(25033)
  .until("v4.7.0")
  .type("burst")
  .costAnemo(3)
  .costEnergy(2)
  .do((c) => {
    const cards = c.player.hands.filter((card) => card.definition.id === BonecrunchersEnergyBlock);
    const stack = Math.floor(cards.length / 2);
    c.characterStatus(BonecrunchersEnergyBlockAccumulated, "@self", {
      overrideVariables: { stack }
    });
    c.damage(DamageType.Anemo, 2);
    c.disposeCard(...cards);
  })
  .done();

/**
 * @id 27023
 * @name 终景迸落
 * @description
 * 造成2点草元素伤害，抓1张唤醒眷属，生成2层绿洲之滋养。
 */
const TheEndFalls = skill(27023)
  .until("v4.7.0")
  .type("burst")
  .costDendro(3)
  .costEnergy(2)
  .damage(DamageType.Dendro, 2)
  .drawCards(1, { withDefinition: AwakenMyKindred })
  .combatStatus(OasisNourishment, "my", {
    overrideVariables: { usage: 2 }
  })
  .done();
