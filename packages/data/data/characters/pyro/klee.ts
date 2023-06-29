import { createCard, createCharacter, createSkill, createStatus, DamageType, DiceType, Target } from "@gi-tcg";

/**
 * **砰砰**
 * 造成1点火元素伤害。
 */
const Kaboom = createSkill(13061)
  .setType("normal")
  .costPyro(1)
  .costVoid(2)
  .dealDamage(1, DamageType.Pyro)
  .build();

/**
 * **爆裂火花**
 * 所附属角色进行重击时：少花费1个火元素，并且伤害+1。
 * 可用次数：1
 */
const ExplosiveSpark = createStatus(113061)
  .withUsage(1)
  .on("beforeUseDice", (c) => {
    const skillCtx = c.useSkillCtx;
    if (skillCtx && skillCtx.isCharged()) {
      c.deductCost(DiceType.Pyro);
    }
    return false;
  })
  .on("beforeUseSkill", (c) => {
    if (c.isCharged() && c.info.type === "normal") {
      c.damage?.addDamage(1);
    } else {
      return false;
    }
  })
  .build();

/**
 * **爆裂火花**
 * 所附属角色进行重击时：少花费1个火元素，并且伤害+1。
 * 可用次数：2
 */
const ExplosiveSpark01 = createStatus(113061)
  .withUsage(2)
  .on("beforeUseDice", (c) => {
    const skillCtx = c.useSkillCtx;
    if (skillCtx && skillCtx.isCharged()) {
      c.deductCost(DiceType.Pyro);
    }
    return false;
  })
  .on("beforeUseSkill", (c) => {
    if (c.isCharged() && c.info.type === "normal") {
      c.damage?.addDamage(1);
    } else {
      return false;
    }
  })
  .build();

/**
 * **蹦蹦炸弹**
 * 造成3点火元素伤害，本角色附属爆裂火花。
 */
const JumpyDumpty = createSkill(13062)
  .setType("elemental")
  .costPyro(3)
  .do((c) => {
    c.dealDamage(3, DamageType.Pyro);
    if (c.character.hasEquipment(PoundingSurprise)) {
      c.createStatus(ExplosiveSpark01);
    } else {
      c.createStatus(ExplosiveSpark);
    }
  })
  .build();

/**
 * **轰轰火花**
 * 所在阵营的角色使用技能后：对所在阵营的出战角色造成2点火元素伤害。
 * 可用次数：2
 */
const SparksNSplashStatus = createStatus(113063)
  .withUsage(2)
  .on("useSkill", (c) => {
    c.dealDamage(2, DamageType.Pyro, Target.myActive());
  })
  .build();

/**
 * **轰轰火花**
 * 造成3点火元素伤害，在对方场上生成轰轰火花。
 */
const SparksNSplash = createSkill(13063)
  .setType("burst")
  .costPyro(3)
  .costEnergy(3)
  .dealDamage(3, DamageType.Pyro)
  .createCombatStatus(SparksNSplashStatus, true)
  .build();

export const Klee = createCharacter(1306)
  .addTags("pyro", "catalyst", "mondstadt")
  .addSkills(Kaboom, JumpyDumpty, SparksNSplash)
  .build();

/**
 * **砰砰礼物**
 * 战斗行动：我方出战角色为可莉时，装备此牌。
 * 可莉装备此牌后，立刻使用一次蹦蹦炸弹。
 * 装备有此牌的可莉生成的爆裂火花的可用次数+1。
 * （牌组中包含可莉，才能加入牌组）
 */
export const PoundingSurprise = createCard(213061)
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(Klee)
  .addActiveCharacterFilter(Klee)
  .costPyro(3)
  .useSkill(JumpyDumpty)
  .buildToEquipment()
  .build();
