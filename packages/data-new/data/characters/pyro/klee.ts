import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **砰砰**
 * 造成1点火元素伤害。
 */
const Kaboom = createSkill(13061)
  .setType("normal")
  .costPyro(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **蹦蹦炸弹**
 * 造成3点火元素伤害，本角色附属爆裂火花。
 */
const JumpyDumpty = createSkill(13062)
  .setType("elemental")
  .costPyro(3)
  // TODO
  .build();

/**
 * **轰轰火花**
 * 造成3点火元素伤害，在对方场上生成轰轰火花。
 */
const SparksNSplash = createSkill(13063)
  .setType("burst")
  .costPyro(3)
  .costEnergy(3)
  // TODO
  .build();

export const Klee = createCharacter(1306)
  .addTags("pyro", "catalyst", "mondstadt")
  .addSkills(Kaboom, JumpyDumpty, SparksNSplash)
  .build();

/**
 * **砰砰礼物**
 * 战斗行动：我方出战角色为可莉时，装备此牌。
 * 可莉装备此牌后，立刻使用一次蹦蹦炸弹。
 * 装备有此牌的可莉生成的爆裂火花的可用次数+1。
 * （牌组中包含可莉，才能加入牌组）
 */
export const PoundingSurprise = createCard(213061)
  .setType("equipment")
  .addTags("talent", "action")
  .costPyro(3)
  // TODO
  .build();
