import { createCard, createCharacter, createSkill, createStatus, createSummon, DamageType } from "@gi-tcg";

/**
 * **猎人射术**
 * 造成2点物理伤害。
 */
const KatzleinStyle = createSkill(11021)
  .setType("normal")
  .costCryo(1)
  .costVoid(2)
  .dealDamage(2, DamageType.Physical)
  .build();

/**
 * **猫爪护盾**
 * 为我方出战角色提供1点护盾。
 */
const CatClawShield = createStatus(111021)
.on("enter", (c) => { c.findCombatStatus(CatClawShield01)?.dispose(); })
  .shield(1)
  .build();

/**
 * **猫爪护盾**
 * 为我方出战角色提供2点护盾。
 */
const CatClawShield01 = createStatus(111022)
  .on("enter", (c) => { c.findCombatStatus(CatClawShield)?.dispose(); })
  .shield(2)
  .build();

/**
 * **猫爪冻冻**
 * 造成2点冰元素伤害，生成猫爪护盾。
 */
const IcyPaws = createSkill(11022)
  .setType("elemental")
  .costCryo(3)
  .dealDamage(2, DamageType.Cryo)
  .do((c) => {
    if (c.character.findEquipment(ShakenNotPurred)) {
      c.character.createStatus(CatClawShield01);
    } else {
      c.character.createStatus(CatClawShield);
    }
  })
  .build();

/**
 * **酒雾领域**
 * 结束阶段：造成1点冰元素伤害，治疗我方出战角色2点。
 * 可用次数：2
 */
const DrunkenMist = createSummon(111023)
  .withUsage(2)
  .on("endPhase", (c) => {
    c.dealDamage(1, DamageType.Cryo);
    c.queryCharacter("|")?.heal(2);
  })
  .build();

/**
 * **最烈特调**
 * 造成1点冰元素伤害，治疗此角色2点，召唤酒雾领域。
 */
const SignatureMix = createSkill(11023)
  .setType("burst")
  .costCryo(3)
  .costEnergy(3)
  .dealDamage(1, DamageType.Cryo)
  .do((c) => c.character.heal(2))
  .summon(DrunkenMist)
  .build();

export const Diona = createCharacter(1102)
  .addTags("cryo", "bow", "mondstadt")
  .addSkills(KatzleinStyle, IcyPaws, SignatureMix)
  .build();

/**
 * **猫爪冰摇**
 * 战斗行动：我方出战角色为迪奥娜时，装备此牌。
 * 迪奥娜装备此牌后，立刻使用一次猫爪冻冻。
 * 装备有此牌的迪奥娜生成的猫爪护盾，所提供的护盾值+1。
 * （牌组中包含迪奥娜，才能加入牌组）
 */
export const ShakenNotPurred = createCard(211021, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(Diona)
  .addCharacterFilter(Diona)
  .costCryo(4)
  .buildToEquipment()
  .on("enter", (c) => { c.useSkill(IcyPaws); })
  .build();
