import { createCard, createCharacter, createSkill, createStatus, createSummon, DamageType, Reaction } from "@gi-tcg";

/**
 * **祈颂射艺**
 * 造成2点物理伤害。
 */
const SupplicantsBowmanship = createSkill(17011)
  .setType("normal")
  .costDendro(1)
  .costVoid(2)
  .dealDamage(2, DamageType.Physical)
  .build();

/**
 * **拂花偈叶**
 * 造成3点草元素伤害。
 */
const FloralBrush = createSkill(17012)
  .setType("elemental")
  .costDendro(3)
  .dealDamage(3, DamageType.Dendro)
  .do((c) => {
    if (c.character.findEquipment(FloralSidewinder)) {
      c.character.createStatus(Sprout);
    }
  })
  .build();

/**
 * **柯里安巴**
 * "结束阶段：造成2点草元素伤害。
 * 可用次数：2
 */
const CuileinAnbar = createSummon(117011)
  .withDuration(2)
  .on("endPhase", (c) => {
    c.dealDamage(2, DamageType.Dendro);
  })
  .build();

/**
 * **猫猫秘宝**
 * 造成2点草元素伤害，召唤柯里安巴。
 */
const TrumpcardKitty = createSkill(17013)
  .setType("burst")
  .costDendro(3)
  .costEnergy(2)
  .dealDamage(2, DamageType.Dendro)
  .summon(CuileinAnbar)
  .build();

export const Collei = createCharacter(1701)
  .addTags("dendro", "bow", "sumeru")
  .maxEnergy(2)
  .addSkills(SupplicantsBowmanship, FloralBrush, TrumpcardKitty)
  .build();

/**
 * **飞叶迴斜**
 * 战斗行动：我方出战角色为柯莱时，装备此牌。
 * 柯莱装备此牌后，立刻使用一次拂花偈叶。
 * 装备有此牌的柯莱使用了拂花偈叶的回合中，我方角色的技能引发草元素相关反应后：造成1点草元素伤害。（每回合1次）
 * （牌组中包含柯莱，才能加入牌组）
 */
export const FloralSidewinder = createCard(217011, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(Collei)
  .addCharacterFilter(Collei)
  .costDendro(4)
  .buildToEquipment()
  .on("enter", (c) => { c.useSkill(FloralBrush); })
  .build();

/**
 * **新叶**
 * 我方角色使用技能引发草元素相关反应后：造成1点草元素伤害。（每回合1次）
 * 持续回合：1
 */
const Sprout = createStatus(117012)
  .withDuration(1)
  .withUsagePerRound(1)
  .on("useSkill",
    (c) => c.getAllDescendingReactions().some((r) => r.relatedWith(DamageType.Dendro)),
    (c) => { c.dealDamage(1, DamageType.Dendro); })
  .build();
