import { createCard, createCharacter, createSkill, createStatus, createSummon, DamageType, DiceType } from "@gi-tcg";

/**
 * **雷晶投射**
 * 造成1点雷元素伤害。
 */
const ElectroCrystalProjection = createSkill(24011)
  .setType("normal")
  .costElectro(1)
  .costVoid(2)
  .dealDamage(1, DamageType.Electro)
  .build();

/**
 * **猜拳三连击·布**
 * 造成3点雷元素伤害。
 */
const RockpaperscissorsComboPaper = createSkill(24016)
  .setType("elemental")
  .dealDamage(3, DamageType.Electro)
  .build();

/**
 * **猜拳三连击·布**
 * 本角色将在下次行动时，直接使用技能：猜拳三连击·布。
 */
const RockpaperscissorsComboPaperStatus = createStatus(124012)
  .prepare(RockpaperscissorsComboPaper)
  .build();

/**
 * **猜拳三连击·剪刀**
 * 造成2点雷元素伤害，然后准备技能：猜拳三连击·布。
 */
const RockpaperscissorsComboScissors = createSkill(24015)
  .setType("elemental")
  .dealDamage(2, DamageType.Electro)
  .createCharacterStatus(RockpaperscissorsComboPaperStatus)
  .build();

/**
 * **猜拳三连击·剪刀**
 * 本角色将在下次行动时，直接使用技能：猜拳三连击·剪刀。
 */
const RockpaperscissorsComboScissorsStatus = createStatus(124011)
  .prepare(RockpaperscissorsComboScissors)
  .build();

/**
 * **猜拳三连击**
 * 造成2点雷元素伤害，然后分别准备技能：猜拳三连击·剪刀和猜拳三连击·布。
 */
const RockpaperscissorsCombo = createSkill(24012)
  .setType("elemental")
  .costElectro(5)
  .dealDamage(2, DamageType.Electro)
  .createCharacterStatus(RockpaperscissorsComboScissorsStatus)
  .build();

/**
 * **雷锁镇域**
 * 结束阶段：造成1点雷元素伤害。
 * 可用次数：2
 * 此召唤物在场时：敌方执行「切换角色」行动的元素骰费用+1。（每回合1次）
 */
const ChainsOfWardingThunder = createSummon(124013)
  .withUsage(2)
  .listenToOpp()
  .withThis({ addCost: true })
  .on("endPhase", (c) => { c.dealDamage(1, DamageType.Electro); })
  .on("beforeUseDice", 
    (c) => c.this.addCost && !!c.switchActiveCtx && !c.switchActiveCtx.to.isMine(), 
    (c) => {
      c.addCost(DiceType.Void);
      c.this.addCost = false;
    })
  .on("actionPhase", (c) => { c.this.addCost = true; })
  .build();

/**
 * **雳霆镇锁**
 * 造成2点雷元素伤害，召唤雷锁镇域。
 */
const LightningLockdown = createSkill(24013)
  .setType("burst")
  .costElectro(3)
  .costEnergy(2)
  .dealDamage(2, DamageType.Electro)
  .summon(ChainsOfWardingThunder)
  .build();

/**
 * **雷晶核心**
 * 所附属角色被击倒时：移除此效果，使角色免于被击倒，并治疗该角色到1点生命值。
 */
const ElectroCrystalCoreStatus = createStatus(124014)
  .withUsage(1)
  .on("beforeDefeated", (c) => {
    c.immune(1);
  })
  .build();

/**
 * **雷晶核心**
 * 【被动】战斗开始时，初始附属雷晶核心。
 */
const ElectroCrystalCore = createSkill(24014)
  .setType("passive")
  .on("battleBegin", (c) => { c.this.master.createStatus(ElectroCrystalCoreStatus); })
  .build();

export const ElectroHypostasis = createCharacter(2401)
  .addTags("electro", "monster")
  .maxHealth(8)
  .maxEnergy(2)
  .addSkills(ElectroCrystalProjection, RockpaperscissorsCombo, LightningLockdown, ElectroCrystalCore, RockpaperscissorsComboScissors, RockpaperscissorsComboPaper)
  .build();

/**
 * **汲能棱晶**
 * 战斗行动：我方出战角色为无相之雷时，治疗该角色3点，并附属雷晶核心。
 * （牌组中包含无相之雷，才能加入牌组）
 */
export const AbsorbingPrism = createCard(224011, ["character"])
  .setType("event")
  .addTags("talent", "action")
  .requireCharacter(ElectroHypostasis)
  .addCharacterFilter(ElectroHypostasis)
  .costElectro(3)
  .do((c) => {
    const ch = c.queryCharacter(`@${ElectroHypostasis}`);
    if (ch) {
      ch.heal(3);
      ch.createStatus(ElectroCrystalCoreStatus);
    }
  })
  .build();
