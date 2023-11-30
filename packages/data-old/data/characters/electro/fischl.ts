import { createCard, createCharacter, createSkill, createSummon, DamageType } from "@gi-tcg";

/**
 * **罪灭之矢**
 * 造成2点物理伤害。
 */
const BoltsOfDownfall = createSkill(14011)
  .setType("normal")
  .costElectro(1)
  .costVoid(2)
  .dealDamage(2, DamageType.Physical)
  .build();

/**
 * **奥兹**
 * 结束阶段：造成1点雷元素伤害。
 * 可用次数：2
 */
const Oz = createSummon(114011)
  .withUsage(2)
  .on("enter", (c) => { c.findSummon(Oz01)?.dispose(); })
  .on("endPhase", (c) => c.dealDamage(1, DamageType.Electro))
  .build();

/**
 * **奥兹**
 * 结束阶段：造成1点雷元素伤害。
 * 可用次数：2
 * 菲谢尔普通攻击后：造成2点雷元素伤害。（需消耗可用次数）
 */
const Oz01 = createSummon(114012)
  .withUsage(2)
  .on("enter", (c) => { c.findSummon(Oz)?.dispose(); })
  .on("endPhase", (c) => c.dealDamage(1, DamageType.Electro))
  .on("useSkill",
    (c) => c.character.info.id === Fischl && c.info.type === "normal",
    (c) => { c.dealDamage(2, DamageType.Electro); })
  .build();

/**
 * **夜巡影翼**
 * 造成1点雷元素伤害，召唤奥兹。
 */
const Nightrider = createSkill(14012)
  .setType("elemental")
  .costElectro(3)
  .dealDamage(1, DamageType.Electro)
  .do((c) => {
    if (c.character.findEquipment(StellarPredator)) {
      c.summon(Oz01);
    } else {
      c.summon(Oz);
    }
  })
  .build();

/**
 * **至夜幻现**
 * 造成4点雷元素伤害，对所有敌方后台角色造成2点穿透伤害。
 */
const MidnightPhantasmagoria = createSkill(14013)
  .setType("burst")
  .costElectro(3)
  .costEnergy(3)
  .dealDamage(2, DamageType.Piercing, "!<>")
  .dealDamage(4, DamageType.Electro)
  .build();

export const Fischl = createCharacter(1401)
  .addTags("electro", "bow", "mondstadt")
  .addSkills(BoltsOfDownfall, Nightrider, MidnightPhantasmagoria)
  .build();

/**
 * **噬星魔鸦**
 * 战斗行动：我方出战角色为菲谢尔时，装备此牌。
 * 菲谢尔装备此牌后，立刻使用一次夜巡影翼。
 * 装备有此牌的菲谢尔生成的奥兹，会在菲谢尔普通攻击后造成2点雷元素伤害。（需消耗可用次数）
 * （牌组中包含菲谢尔，才能加入牌组）
 */
export const StellarPredator = createCard(214011, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(Fischl)
  .addCharacterFilter(Fischl)
  .costElectro(3)
  .buildToEquipment()
  .on("enter", (c) => { c.useSkill(Nightrider); })
  .build();
