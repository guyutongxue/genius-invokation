import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **七圣枪术**
 * 造成2点物理伤害。
 */
const InvokersSpear = createSkill(14041)
  .setType("normal")
  .costElectro(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **秘仪·律渊渡魂**
 * 造成3点雷元素伤害。
 */
const SecretRiteChasmicSoulfarer = createSkill(14042)
  .setType("elemental")
  .costElectro(3)
  // TODO
  .build();

/**
 * **圣仪·煟煌随狼行**
 * 造成4点雷元素伤害，
 * 启途誓使的[凭依]级数+2。
 */
const SacredRiteWolfsSwiftness = createSkill(14043)
  .setType("burst")
  .costElectro(4)
  .costEnergy(2)
  // TODO
  .build();

/**
 * **行度誓惩**
 * 【被动】战斗开始时，初始附属启途誓使。
 */
const LawfulEnforcer = createSkill(14044)
  .setType("passive")
  // TODO
  .build();

export const Cyno = createCharacter(1404)
  .addTags("electro", "pole", "sumeru")
  .addSkills(InvokersSpear, SecretRiteChasmicSoulfarer, SacredRiteWolfsSwiftness, LawfulEnforcer)
  .build();

/**
 * **落羽的裁择**
 * 战斗行动：我方出战角色为赛诺时，装备此牌。
 * 赛诺装备此牌后，立刻使用一次秘仪·律渊渡魂。
 * 装备有此牌的赛诺在启途誓使的「凭依」级数为3或5时使用秘仪·律渊渡魂时，造成的伤害额外+1。
 * （牌组中包含赛诺，才能加入牌组）
 */
export const FeatherfallJudgment = createCard(214041)
  .setType("equipment")
  .addTags("talent", "action")
  .costElectro(3)
  // TODO
  .build();
