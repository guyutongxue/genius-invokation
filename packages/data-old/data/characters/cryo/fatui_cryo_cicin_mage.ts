import { createCard, createCharacter, createSkill, createStatus, createSummon, DamageType, SummonHandle } from "@gi-tcg";

/**
 * **冰萤棱锥**
 * 造成1点冰元素伤害。
 */
const CicinIcicle = createSkill(21011)
  .setType("normal")
  .costCryo(1)
  .costVoid(2)
  .dealDamage(1, DamageType.Cryo)
  .build();

/**
 * **冰萤**
 * 结束阶段：造成1点冰元素伤害。
 * 可用次数：2（可叠加，最多叠加到3次）
 * 愚人众·冰萤术士「普通攻击」后：此牌可用次数+1。
 * 我方角色受到发生元素反应的伤害后：此牌可用次数-1。
 */
const CryoCicins: SummonHandle = createSummon(121011)
  .withUsage(2, 3)
  .on("endPhase", (c) => {
    c.dealDamage(1, DamageType.Cryo);
  })
  .on("useSkill",
    (c) => c.character.info.id === FatuiCryoCicinMage
      && c.info.type === "normal",
    (c) => {
      c.this.setUsage(c.this.usage + 1);
    })
  .on("damaged",
    (c) => !!c.reaction,
    (c) => {
      c.this.setUsage(c.this.usage - 1);
    })
  .build();

/**
 * **雾虚摇唤**
 * 造成1点冰元素伤害，召唤冰萤。
 */
const MistySummons = createSkill(21012)
  .setType("elemental")
  .costCryo(3)
  .dealDamage(1, DamageType.Cryo)
  .summon(CryoCicins)
  .build();

/**
 * **流萤护罩**
 * 为我方出战角色提供1点护盾。
 * 创建时：如果我方场上存在冰萤，则额外提供其可用次数的护盾。（最多额外提供3点护盾）
 */
const FlowingCicinShield = createStatus(121012)
  .shield(1)
  .on("enter", (c) => {
    const additionalValue = Math.min(3, c.findSummon(CryoCicins)?.usage ?? 0);
    c.this.setValue(c.this.value + additionalValue);
  })
  .build();

/**
 * **冰枝白花**
 * 造成5点冰元素伤害，本角色附着冰元素，生成流萤护罩。
 */
const BlizzardBranchBlossom = createSkill(21013)
  .setType("burst")
  .costCryo(3)
  .costEnergy(3)
  .dealDamage(5, DamageType.Cryo)
  .do((c) => {
    c.applyElement(DamageType.Cryo, c.character.asTarget());
  })
  .createCombatStatus(FlowingCicinShield)
  .build();

export const FatuiCryoCicinMage = createCharacter(2101)
  .addTags("cryo", "fatui")
  .addSkills(CicinIcicle, MistySummons, BlizzardBranchBlossom)
  .build();

/**
 * **冰萤寒光**
 * 战斗行动：我方出战角色为愚人众·冰萤术士时，装备此牌。
 * 愚人众·冰萤术士装备此牌后，立刻使用一次雾虚摇唤。
 * 装备有此牌的愚人众·冰萤术士使用技能后：如果冰萤的可用次数被叠加到超过上限，则造成2点冰元素伤害。
 * （牌组中包含愚人众·冰萤术士，才能加入牌组）
 */
export const CicinsColdGlare = createCard(221011, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(FatuiCryoCicinMage)
  .addCharacterFilter(FatuiCryoCicinMage)
  .costCryo(3)
  .buildToEquipment()
  .on("enter", (c) => { c.useSkill(MistySummons); })
  .on("useSkill", (c) => {
    const summon = c.findSummon(CryoCicins);
    if (!summon) return;
    if (summon.usage > summon.info.maxUsage) {
      c.dealDamage(2, DamageType.Cryo);
    }
  })
  .build();
