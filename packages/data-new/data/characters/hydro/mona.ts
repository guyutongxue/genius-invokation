import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **因果点破**
 * 造成1点水元素伤害。
 */
const RippleOfFate = createSkill(12031)
  .setType("normal")
  .costHydro(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **水中幻愿**
 * 造成1点水元素伤害，召唤虚影。
 */
const MirrorReflectionOfDoom = createSkill(12032)
  .setType("elemental")
  .costHydro(3)
  // TODO
  .build();

/**
 * **星命定轨**
 * 造成4点水元素伤害，生成泡影。
 */
const StellarisPhantasm = createSkill(12033)
  .setType("burst")
  .costHydro(3)
  .costEnergy(3)
  // TODO
  .build();

/**
 * **虚实流动**
 * 【被动】此角色为出战角色，我方执行「切换角色」行动时：将此次切换视为「快速行动」而非「战斗行动」。（每回合1次）
 */
const IllusoryTorrent = createSkill(12034)
  .setType("passive")
  // TODO
  .build();

export const Mona = createCharacter(1203)
  .addTags("hydro", "catalyst", "mondstadt")
  .addSkills(RippleOfFate, MirrorReflectionOfDoom, StellarisPhantasm, IllusoryTorrent)
  .build();

/**
 * **沉没的预言**
 * 战斗行动：我方出战角色为莫娜时，装备此牌。
 * 莫娜装备此牌后，立刻使用一次星命定轨。
 * 装备有此牌的莫娜出战期间，我方引发的水元素相关反应伤害额外+2。
 * （牌组中包含莫娜，才能加入牌组）
 */
export const ProphecyOfSubmersion = createCard(212031)
  .setType("equipment")
  .addTags("talent", "action")
  .costHydro(3)
  .costEnergy(3)
  // TODO
  .build();
