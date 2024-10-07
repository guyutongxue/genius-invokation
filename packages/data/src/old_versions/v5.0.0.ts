import { card, skill } from "@gi-tcg/core/builder";

/**
 * @id 321015
 * @name 风龙废墟
 * @description
 * 入场时：从牌组中随机抽取一张「天赋」牌。
 * 我方打出「天赋」牌，或我方角色使用原本元素骰消耗至少为4的技能时：少花费1个元素骰。（每回合1次）
 * 可用次数：3
 */
const StormterrorsLair = card(321015)
  .until("v5.0.0")
  .costSame(2)
  .support("place")
  .on("enter")
  .drawCards(1, { withTag: "talent" })
  .on("deductOmniDice", (c, e) => {
    return e.hasCardTag("talent") ||
      (e.isUseSkill() && e.action.skill.definition.requiredCost.filter((d) => d !== DiceType.Energy).length >= 4);
  })
  .usage(3)
  .usagePerRound(1)
  .deductOmniCost(1)
  .done();

/**
 * @id 114091
 * @name 引雷
 * @description
 * 此状态初始具有2层「引雷」；重复附属时，叠加1层「引雷」。「引雷」最多可以叠加到4层。
 * 结束阶段：叠加1层「引雷」。
 * 所附属角色受到苍雷伤害时：移除此状态，每层「引雷」使此伤害+1。
 */
const Conductive = status(114091)
  .until("v5.0.0")
  .variableCanAppend("conductive", 2, 4, 1)
  .on("endPhase")
  .addVariableWithMax("conductive", 1, 4)
  .on("increaseDamaged", (c, e) => e.via.definition.id === VioletArc)
  .do((c, e) => {
    e.increaseDamage(c.getVariable("conductive"));
    c.dispose();
  })
  .done();

/**
 * @id 14091
 * @name 指尖雷暴
 * @description
 * 造成1点雷元素伤害；
 * 如果此技能为重击，则使敌方出战角色附属引雷。
 */
const LightningTouch = skill(14091)
  .until("v5.0.0")
  .type("normal")
  .costElectro(1)
  .costVoid(2)
  .damage(DamageType.Electro, 1)
  .if((c) => c.skillInfo.charged)
  .characterStatus(Conductive, "opp active")
  .done();

/**
 * @id 123034
 * @name 炎之魔蝎·守势
 * @description
 * 厄灵·炎之魔蝎在场时：所附属角色受到的伤害-1。（每回合至多2次）
 */
const PyroScorpionGuardianStance01: StatusHandle = status(123034)
  .until("v5.0.0")
  .conflictWith(123033)
  .on("decreaseDamaged", (c, e) => e.value > 0 &&
    c.$(`my summons with definition id ${SpiritOfOmenPyroScorpion01} or my summons with definition id ${SpiritOfOmenPyroScorpion}`))
  .usagePerRound(2)
  .decreaseDamage(1)
  .done();

/**
 * @id 123032
 * @name 厄灵·炎之魔蝎
 * @description
 * 结束阶段：造成1点火元素伤害；如果本回合中镀金旅团·炽沙叙事人使用过「普通攻击」或「元素战技」，则此伤害+1。
 * 可用次数：2
 * 入场时和行动阶段开始：使我方镀金旅团·炽沙叙事人附属炎之魔蝎·守势。（厄灵·炎之魔蝎在场时每回合至多2次，使角色受到的伤害-1。）
 */
const SpiritOfOmenPyroScorpion01 = summon(123032)
  .until("v5.0.0")
  .conflictWith(123031)
  .hintIcon(DamageType.Pyro)
  .hintText("1")
  .on("endPhase")
  .usage(2)
  .do((c) => {
    if (c.countOfSkill(EremiteScorchingLoremaster, SearingGlare) > 0 ||
      c.countOfSkill(EremiteScorchingLoremaster, BlazingStrike) > 0) {
      c.damage(DamageType.Pyro, 2);
    } else {
      c.damage(DamageType.Pyro, 1);
    }
  })
  .on("enter")
  .if((c) => c.$(`my equipment with definition id ${Scorpocalypse}`))
  .characterStatus(PyroScorpionGuardianStance01, `my character with definition id 2303`)
  .else()
  .characterStatus(PyroScorpionGuardianStance, `my character with definition id 2303`)
  .on("actionPhase")
  .if((c) => c.$(`my equipment with definition id ${Scorpocalypse}`))
  .characterStatus(PyroScorpionGuardianStance01, `my character with definition id 2303`)
  .else()
  .characterStatus(PyroScorpionGuardianStance, `my character with definition id 2303`)
  .done();

/**
 * @id 23032
 * @name 炎晶迸击
 * @description
 * 造成3点火元素伤害。
 */
const BlazingStrike = skill(23032)
  .until("v5.0.0")
  .type("elemental")
  .costPyro(3)
  .damage(DamageType.Pyro, 3)
  .done();

/**
 * @id 23033
 * @name 厄灵苏醒·炎之魔蝎
 * @description
 * 造成2点火元素伤害，召唤厄灵·炎之魔蝎。
 */
const SpiritOfOmensAwakeningPyroScorpion: SkillHandle = skill(23033)
  .until("v5.0.0")
  .type("burst")
  .costPyro(3)
  .costEnergy(2)
  .damage(DamageType.Pyro, 2)
  .if((c) => c.self.hasEquipment(Scorpocalypse))
  .summon(SpiritOfOmenPyroScorpion01)
  .else()
  .summon(SpiritOfOmenPyroScorpion)
  .done();

/**
 * @id 23034
 * @name 厄灵之能
 * @description
 * 【被动】此角色受到伤害后：如果此角色生命值不多于7，则获得1点充能。（整场牌局限制1次）
 */
const SpiritOfOmensPower = skill(23034)
  .until("v5.0.0")
  .type("passive")
  .on("damaged")
  .usage(1, { name: "damagedEnergySkillUsage", autoDispose: false })
  .if((c) => c.self.health <= 7)
  .gainEnergy(1, "@self")
  .done();

/**
 * @id 223031
 * @name 魔蝎烈祸
 * @description
 * 战斗行动：我方出战角色为镀金旅团·炽沙叙事人时，装备此牌。
 * 镀金旅团·炽沙叙事人装备此牌后，立刻使用一次厄灵苏醒·炎之魔蝎。
 * 装备有此牌的镀金旅团·炽沙叙事人生成的厄灵·炎之魔蝎在镀金旅团·炽沙叙事人使用过「普通攻击」或「元素战技」的回合中，造成的伤害+1；
 * 厄灵·炎之魔蝎的减伤效果改为每回合至多2次。
 * （牌组中包含镀金旅团·炽沙叙事人，才能加入牌组）
 */
const Scorpocalypse = card(223031)
  .until("v5.0.0")
  .costPyro(3)
  .costEnergy(2)
  .talent(EremiteScorchingLoremaster)
  .on("enter")
  .useSkill(SpiritOfOmensAwakeningPyroScorpion)
  .done();

/**
 * @id 127028
 * @name 绿洲之庇护
 * @description
 * 提供2点护盾，保护所附属角色。
 */
const OasissAegis = status(127028)
  .until("v5.0.0")
  .shield(2)
  .done();

/**
 * @id 127029
 * @name 绿洲之心
 * @description
 * 我方召唤4个增殖生命体后，我方阿佩普的绿洲守望者附属重燃的绿洲之心，并获得2点护盾。
 */
const HeartOfOasis = combatStatus(127029)
  .until("v5.0.0")
  .variable("organismCount", 0)
  .on("enterRelative", (c, e) =>
    [
      ProliferatedOrganism01,
      ProliferatedOrganism02,
      ProliferatedOrganism03,
      ProliferatedOrganism04,
    ].includes(e.entity.definition.id as SummonHandle))
  .listenToPlayer()
  .do((c) => {
    c.addVariable("organismCount", 1);
    if (c.getVariable("organismCount") === 4) {
      const apep = c.$(`my character with definition id ${GuardianOfApepsOasis}`);
      apep?.addStatus(ReignitedHeartOfOasis);
      apep?.addStatus(OasissAegis);
      c.dispose();
    }
  })
  .done();

/**
 * @id 27024
 * @name 增殖感召
 * @description
 * 【被动】战斗开始时，生成6张唤醒眷属，随机放入牌库。我方召唤4个增殖生命体后，此角色附属重燃的绿洲之心，并获得2点护盾。
 */
const InvokationOfPropagation = skill(27024)
  .until("v5.0.0")
  .type("passive")
  .variable("organismCount", 0)
  .on("battleBegin")
  .createPileCards(AwakenMyKindred, 6, "random")
  .combatStatus(HeartOfOasis)
  .done();
