import { DamageType, createCard, createCharacter, createSkill, createStatus } from "@gi-tcg";

/**
 * **流耀枪术·守势**
 * 造成2点物理伤害。
 */
const GleamingSpearGuardianStance = createSkill(-10)
  .setType("normal")
  .costHydro(1)
  .costVoid(2)
  .dealDamage(2, DamageType.Physical)
  .build()

/**
 * **苍鹭震击**
 * （需准备1个行动轮）
 * 造成3点水元素伤害。
 */
const HeronStrike = createSkill(-12)
  .setType("elemental", false)
  .dealDamage(3, DamageType.Hydro)
  .build()

/**
 * **苍鹭护盾**
 * 本角色将在下次行动时，直接使用技能：苍鹭震击。
 * 准备技能期间：提供2点护盾，保护所附属的角色。
 */
const HeronShield = createStatus(-11)
  .prepare(HeronStrike)
  .shield(2)
  .build()

/**
 * **圣仪·苍鹭庇卫**
 * 本角色附属苍鹭护盾并准备技能：苍鹭震击。
 */
const SacredRiteHeronsSanctum = createSkill(-13)
  .setType("elemental")
  .costHydro(3)
  .createStatus(HeronShield)
  .build()

/**
 * **赤冕祝祷**
 * 我方角色普通攻击造成的伤害+1。
 * 我方单手剑、双手剑或长柄武器角色造成的物理伤害变为水元素伤害。
 * 我方切换角色后：造成1点水元素伤害。（每回合1次）
 * 持续回合：2
 */
const PrayerOfTheCrimsonCrown = createStatus(-14)
  .withDuration(2)
  // TODO
  .build()

/**
 * **圣仪·灰鸰衒潮**
 * 造成2点水元素伤害，生成赤冕祝祷。
 */
const SacredRiteWagtailsTide = createSkill(-15)
  .costHydro(3)
  .costEnergy(2)
  .dealDamage(2, DamageType.Hydro)
  .createCombatStatus(PrayerOfTheCrimsonCrown)
  .build()

const Candace = createCharacter(-16)
  .addTags("hydro", "sword", "sumeru")
  .addSkills(GleamingSpearGuardianStance, HeronStrike, SacredRiteHeronsSanctum, SacredRiteWagtailsTide)
  .build()

/**
 * **衍溢的汐潮**
 * 我方出战角色为坎蒂丝时，装备此牌。
 * 坎蒂丝装备此牌后，立刻使用一次圣仪·灰鸰衒潮。
 * 装备有此牌的坎蒂丝生成的赤冕祝祷额外具有以下效果：
 * 我方角色普通攻击后：造成1点水元素伤害（每回合1次）
 * （牌组中包含坎蒂丝，才能加入牌组）
 */
const TheOverflow = createCard(-17, ["character"])
  .addTags("action", "talent")
  .requireCharacter(Candace)
  .addCharacterFilter(Candace)
  .costHydro(4)
  .costEnergy(2)
  .useSkill(SacredRiteWagtailsTide)
  .buildToEquipment()
  // TODO
  .build()
