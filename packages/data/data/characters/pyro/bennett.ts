import { createCard, createCharacter, createSkill, createStatus, DamageType } from "@gi-tcg";

/**
 * **好运剑**
 * 造成2点物理伤害。
 */
const StrikeOfFortune = createSkill(13031)
  .setType("normal")
  .costPyro(1)
  .costVoid(2)
  .dealDamage(2, DamageType.Physical)
  .build();

/**
 * **热情过载**
 * 造成3点火元素伤害。
 */
const PassionOverload = createSkill(13032)
  .setType("elemental")
  .costPyro(3)
  .dealDamage(3, DamageType.Pyro)
  .build();

/**
 * **鼓舞领域**
 * 我方角色使用技能时：如果该角色生命值至少为7，则使此伤害额外+2；技能结算后，如果该角色生命值不多于6，则治疗该角色2点。
 * 持续回合：2
 */
const InspirationField = createStatus(113031)
  .withDuration(2)
  .on("beforeSkillDamage",
    (c) => c.sourceSkill.character.health <= 7,
    (c) => c.addDamage(2))
  .on("useSkill",
    (c) => c.character.health <= 6,
    (c) => c.character.heal(2))
  .build();

/**
 * **鼓舞领域**
 * 我方角色使用技能时：此技能伤害+2；技能结算后，如果该角色生命值不多于6，则治疗该角色2点。
 * 持续回合：2
 */
const InspirationField01 = createStatus(113032)
  .withDuration(2)
  .on("beforeSkillDamage",
    (c) => c.addDamage(2))
  .on("useSkill",
    (c) => c.character.health <= 6,
    (c) => c.character.heal(2))
  .build();

/**
 * **美妙旅程**
 * 造成2点火元素伤害，生成鼓舞领域。
 */
const FantasticVoyage = createSkill(13033)
  .setType("burst")
  .costPyro(4)
  .costEnergy(2)
  .do((c) => {
    c.dealDamage(2, DamageType.Pyro);
    if (c.character.findEquipment(GrandExpectation)) {
      c.createCombatStatus(InspirationField01);
    } else {
      c.createCombatStatus(InspirationField);
    }
  })
  .createCombatStatus(InspirationField)
  .build();

export const Bennett = createCharacter(1303)
  .addTags("pyro", "sword", "mondstadt")
  .maxEnergy(2)
  .addSkills(StrikeOfFortune, PassionOverload, FantasticVoyage)
  .build();

/**
 * **冒险憧憬**
 * 战斗行动：我方出战角色为班尼特时，装备此牌。
 * 班尼特装备此牌后，立刻使用一次美妙旅程。
 * 装备有此牌的班尼特生成的鼓舞领域，其伤害提升效果改为总是生效，不再具有生命值限制。
 * （牌组中包含班尼特，才能加入牌组）
 */
export const GrandExpectation = createCard(213031, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(Bennett)
  .addCharacterFilter(Bennett)
  .costPyro(4)
  .costEnergy(2)
  .buildToEquipment()
  .on("enter", (c) => { c.useSkill(FantasticVoyage) })
  .build();
