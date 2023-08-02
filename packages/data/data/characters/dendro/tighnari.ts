import { createCard, createCharacter, createSkill, createStatus, createSummon, DamageType, DiceType } from "@gi-tcg";

/**
 * **藏蕴破障**
 * 造成2点物理伤害。
 */
const KhandaBarrierbuster = createSkill(17021)
  .setType("normal")
  .costDendro(1)
  .costVoid(2)
  .dealDamage(2, DamageType.Physical)
  .build();

/**
 * **通塞识**
 * 所附属角色进行重击时：造成的物理伤害变为草元素伤害，并且会在技能结算后召唤藏蕴花矢。
 * 可用次数：2
 */
const VijnanaSuffusion = createStatus(117021)
  .withUsage(2)
  .on("earlyBeforeDealDamage",
    (c) => !!c.sourceSkill && c.sourceSkill.plunging,
    (c) => {
      c.changeDamageType(DamageType.Dendro);
      return false; // 在使用技能后扣除次数
    })
  .on("useSkill",
    (c) => c.plunging,
    (c) => {
      c.summon(ClusterBloomArrow);
    })
  .build();

/**
 * **藏蕴花矢**
 * 结束阶段：造成1点草元素伤害。
 * 可用次数：1（可叠加，最多叠加到2次）
 */
const ClusterBloomArrow = createSummon(117022)
  .withUsage(1, 2)
  .on("endPhase", (c) => {
    c.dealDamage(1, DamageType.Dendro);
  })
  .build();

/**
 * **识果种雷**
 * 造成2点草元素伤害，本角色附属通塞识。
 */
const VijnanaphalaMine = createSkill(17022)
  .setType("elemental")
  .costDendro(3)
  .dealDamage(2, DamageType.Dendro)
  .createCharacterStatus(VijnanaSuffusion)
  .build();

/**
 * **造生缠藤箭**
 * 造成4点草元素伤害，对所有敌方后台角色造成1点穿透伤害。
 */
const FashionersTanglevineShaft = createSkill(17023)
  .setType("burst")
  .costDendro(3)
  .costEnergy(2)
  .dealDamage(1, DamageType.Piercing, "!<>")
  .dealDamage(4, DamageType.Dendro)
  .build();

export const Tighnari = createCharacter(1702)
  .addTags("dendro", "bow", "sumeru")
  .maxEnergy(2)
  .addSkills(KhandaBarrierbuster, VijnanaphalaMine, FashionersTanglevineShaft)
  .build();

/**
 * **眼识殊明**
 * 战斗行动：我方出战角色为提纳里时，装备此牌。
 * 提纳里装备此牌后，立刻使用一次识果种雷。
 * 装备有此牌的提纳里在附属通塞识状态期间，进行重击时少花费1个无色元素。
 * （牌组中包含提纳里，才能加入牌组）
 */
export const KeenSight = createCard(217021, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(Tighnari)
  .addCharacterFilter(Tighnari)
  .costDendro(4)
  .buildToEquipment()
  .on("enter", (c) => { c.useSkill(VijnanaphalaMine); })
  .on("beforeUseDice",
    (c) => !!c.this.master.findStatus(VijnanaSuffusion) && !!c.useSkillCtx && c.useSkillCtx.plunging,
    (c) => {
      c.deductCost(DiceType.Void);
    })
  .build();
