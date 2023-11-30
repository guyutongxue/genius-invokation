import { character, skill, summon, combatStatus, card, DamageType } from "@gi-tcg";

/**
 * @id 112031
 * @name 虚影
 * @description
 * 我方出战角色受到伤害时：抵消1点伤害。
 * 可用次数：1，耗尽时不弃置此牌。
 * 结束阶段：弃置此牌，造成1点水元素伤害。
 */
const Reflection = summon(112031)
  // TODO
  .done();

/**
 * @id 112032
 * @name 泡影
 * @description
 * 我方造成技能伤害时：移除此状态，使本次伤害加倍。
 */
const IllusoryBubble = combatStatus(112032)
  // TODO
  .done();

/**
 * @id 12031
 * @name 因果点破
 * @description
 * 造成1点水元素伤害。
 */
const RippleOfFate = skill(12031)
  .type("normal")
  .costHydro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 12032
 * @name 水中幻愿
 * @description
 * 造成1点水元素伤害，召唤虚影。
 */
const MirrorReflectionOfDoom = skill(12032)
  .type("elemental")
  .costHydro(3)
  // TODO
  .done();

/**
 * @id 12033
 * @name 星命定轨
 * @description
 * 造成4点水元素伤害，生成泡影。
 */
const StellarisPhantasm = skill(12033)
  .type("burst")
  .costHydro(3)
  .costEnergy(3)
  // TODO
  .done();

/**
 * @id 12034
 * @name 虚实流动
 * @description
 * 【被动】此角色为出战角色，我方执行「切换角色」行动时：将此次切换视为「快速行动」而非「战斗行动」。（每回合1次）
 */
const IllusoryTorrent = skill(12034)
  .type("passive")
  // TODO
  .done();

/**
 * @id 1203
 * @name 莫娜
 * @description
 * 无论胜负平弃，都是命当如此。
 */
const Mona = character(1203)
  .tags("hydro", "catalyst", "mondstadt")
  .skills(RippleOfFate, MirrorReflectionOfDoom, StellarisPhantasm, IllusoryTorrent)
  .done();

/**
 * @id 212031
 * @name 沉没的预言
 * @description
 * 战斗行动：我方出战角色为莫娜时，装备此牌。
 * 莫娜装备此牌后，立刻使用一次星命定轨。
 * 装备有此牌的莫娜出战期间，我方引发的水元素相关反应伤害额外+2。
 * （牌组中包含莫娜，才能加入牌组）
 */
const ProphecyOfSubmersion = card(212031, "character")
  .costHydro(3)
  .costEnergy(3)
  .talentOf(Mona)
  .equipment()
  // TODO
  .done();
