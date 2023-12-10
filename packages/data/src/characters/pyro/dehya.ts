import { character, skill, summon, status, combatStatus, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 113093
 * @name 净焰剑狱领域
 * @description
 * 结束阶段：造成1点火元素伤害。
 * 可用次数：3
 * 当此召唤物在场且迪希雅在我方后台，我方出战角色受到伤害时：抵消1点伤害；然后，如果迪希雅生命值至少为7，则对其造成1点穿透伤害。（每回合1次）
 */
const FierySanctumField = summon(113093)
  // TODO
  .done();

/**
 * @id 113091
 * @name 炽炎狮子·炽鬃拳
 * @description
 * 本角色将在下次行动时，直接使用技能：炽鬃拳。
 */
const BlazingLionessFlamemanesFist = status(113091)
  // TODO
  .done();

/**
 * @id 113092
 * @name 炽炎狮子·焚落踢
 * @description
 * 本角色将在下次行动时，直接使用技能：焚落踢。
 */
const BlazingLionessIncinerationDrive = status(113092)
  // TODO
  .done();

/**
 * @id 113094
 * @name 净焰剑狱之护
 * @description
 * 当净焰剑狱领域在场且迪希雅在我方后台，我方出战角色受到伤害时：抵消1点伤害；然后，如果迪希雅生命值至少为7，则其受到1点穿透伤害。（每回合1次）
 */
const FierySanctumsProtection = combatStatus(113094)
  // TODO
  .done();

/**
 * @id 13091
 * @name 拂金剑斗术
 * @description
 * 造成2点物理伤害。
 */
const SandstormAssault = skill(13091)
  .type("normal")
  .costPyro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 13092
 * @name 熔铁流狱
 * @description
 * 召唤净焰剑狱领域；如果已存在净焰剑狱领域，就先造成1点火元素伤害。
 */
const MoltenInferno = skill(13092)
  .type("elemental")
  .costPyro(3)
  // TODO
  .done();

/**
 * @id 13093
 * @name 炎啸狮子咬
 * @description
 * 造成3点火元素伤害，然后准备技能：焚落踢。
 */
const LeonineBite = skill(13093)
  .type("burst")
  .costPyro(4)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 13095
 * @name 焚落踢
 * @description
 * 造成3点火元素伤害。
 */
const IncinerationDrive = skill(13095)
  .type("burst")
  // TODO
  .done();

/**
 * @id 13096
 * @name 净焰剑狱·赤鬃之血
 * @description
 * 
 */
const FierySanctumRedmanesBlood = skill(13096)
  .type("passive")
  // TODO
  .done();

/**
 * @id 1309
 * @name 迪希雅
 * @description
 * 鹫鸟的眼睛，狮子的灵魂，沙漠自由的女儿。
 */
const Dehya = character(1309)
  .tags("pyro", "claymore", "sumeru")
  .skills(SandstormAssault, MoltenInferno, LeonineBite, IncinerationDrive, FierySanctumRedmanesBlood)
  .done();

/**
 * @id 213091
 * @name 崇诚之真
 * @description
 * 战斗行动：我方出战角色为迪希雅时，装备此牌。
 * 迪希雅装备此牌后，立刻使用一次熔铁流狱。
 * 结束阶段：如果装备有此牌的迪希雅生命值不多于6，则治疗该角色2点。
 * （牌组中包含迪希雅，才能加入牌组）
 */
const StalwartAndTrue = card(213091)
  .costPyro(4)
  .talentOf(Dehya)
  .equipment()
  // TODO
  .done();
