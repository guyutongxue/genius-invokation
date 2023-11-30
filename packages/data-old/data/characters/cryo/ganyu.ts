import { createCard, createCharacter, createSkill, createStatus, createSummon, DamageType } from "@gi-tcg";

/**
 * **流天射术**
 * 造成2点物理伤害。
 */
const LiutianArchery = createSkill(11011)
  .setType("normal")
  .costCryo(1)
  .costVoid(2)
  .dealDamage(2, DamageType.Physical)
  .build();

/**
 * **冰莲**
 * 我方出战角色受到伤害时：抵消1点伤害。
 * 可用次数：2
 */
const IceLotus = createStatus(111012)
  .withUsage(2)
  .on("beforeDamaged",
    (c) => c.target.isActive(),
    (c) => { c.decreaseDamage(1); })
  .build();

/**
 * **山泽麟迹**
 * 造成1点冰元素伤害，生成冰莲。
 */
const TrailOfTheQilin = createSkill(11012)
  .setType("elemental")
  .costCryo(3)
  .dealDamage(1, DamageType.Cryo)
  .createCharacterStatus(IceLotus)
  .build();

/**
 * **霜华矢**
 * 造成2点冰元素伤害，对所有敌方后台角色造成2点穿透伤害。
 */
const FrostflakeArrow = createSkill(11013)
  .setType("normal")
  .costCryo(5)
  .do((c) => {
    if (c.character.findEquipment(UndividedHeart) && c.skillCount(FrostflakeArrow) > 0) {
      c.dealDamage(3, DamageType.Piercing, "!<>");
    } else {
      c.dealDamage(2, DamageType.Piercing, "!<>");
    }
    c.dealDamage(2, DamageType.Cryo);
  })
  .build();

/**
 * **冰灵珠**
 * 结束阶段：造成1点冰元素伤害，对所有敌方后台角色造成1点穿透伤害。
 * 可用次数：2
 */
const SacredCryoPearl = createSummon(111011)
  .withUsage(2)
  .on("endPhase", (c) => {
    c.dealDamage(1, DamageType.Piercing, "!<>");
    c.dealDamage(1, DamageType.Cryo);
  })
  .build();

/**
 * **降众天华**
 * 造成2点冰元素伤害，对所有敌方后台角色造成1点穿透伤害，召唤冰灵珠。
 */
const CelestialShower = createSkill(11014)
  .setType("burst")
  .costCryo(3)
  .costEnergy(3)
  .dealDamage(1, DamageType.Piercing, "!<>")
  .dealDamage(2, DamageType.Cryo)
  .summon(SacredCryoPearl)
  .build();

export const Ganyu = createCharacter(1101)
  .addTags("cryo", "bow", "liyue")
  .addSkills(LiutianArchery, TrailOfTheQilin, FrostflakeArrow, CelestialShower)
  .build();

/**
 * **唯此一心**
 * 战斗行动：我方出战角色为甘雨时，装备此牌。
 * 甘雨装备此牌后，立刻使用一次霜华矢。
 * 装备有此牌的甘雨使用霜华矢时：如果此技能在本场对局中曾经被使用过，则其对敌方后台角色造成的穿透伤害改为3点。
 * （牌组中包含甘雨，才能加入牌组）
 */
export const UndividedHeart = createCard(211011, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(Ganyu)
  .addCharacterFilter(Ganyu)
  .costCryo(5)
  .buildToEquipment()
  .build();
