import { character, skill, status, combatStatus, card, DamageType } from "@gi-tcg";

/**
 * @id 113062
 * @name 爆裂火花
 * @description
 * 所附属角色进行重击时：少花费1个火元素，并且伤害+1。
 * 可用次数：2
 */
const ExplosiveSpark01 = status(113062)
  // TODO
  .done();

/**
 * @id 113061
 * @name 爆裂火花
 * @description
 * 所附属角色进行重击时：少花费1个火元素，并且伤害+1。
 * 可用次数：1
 */
const ExplosiveSpark = status(113061)
  // TODO
  .done();

/**
 * @id 113063
 * @name 轰轰火花
 * @description
 * 所在阵营的角色使用技能后：对所在阵营的出战角色造成2点火元素伤害。
 * 可用次数：2
 */
const SparksNSplashStatus = combatStatus(113063)
  // TODO
  .done();

/**
 * @id 13061
 * @name 砰砰
 * @description
 * 造成1点火元素伤害。
 */
const Kaboom = skill(13061)
  .type("normal")
  .costPyro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 13062
 * @name 蹦蹦炸弹
 * @description
 * 造成3点火元素伤害，本角色附属爆裂火花。
 */
const JumpyDumpty = skill(13062)
  .type("elemental")
  .costPyro(3)
  // TODO
  .done();

/**
 * @id 13063
 * @name 轰轰火花
 * @description
 * 造成3点火元素伤害，在对方场上生成轰轰火花。
 */
const SparksNSplash = skill(13063)
  .type("burst")
  .costPyro(3)
  .costEnergy(3)
  // TODO
  .done();

/**
 * @id 1306
 * @name 可莉
 * @description
 * 每一次抽牌，都可能带来一次「爆炸性惊喜」。
 */
const Klee = character(1306)
  .tags("pyro", "catalyst", "mondstadt")
  .skills(Kaboom, JumpyDumpty, SparksNSplash)
  .done();

/**
 * @id 213061
 * @name 砰砰礼物
 * @description
 * 战斗行动：我方出战角色为可莉时，装备此牌。
 * 可莉装备此牌后，立刻使用一次蹦蹦炸弹。
 * 装备有此牌的可莉生成的爆裂火花的可用次数+1。
 * （牌组中包含可莉，才能加入牌组）
 */
const PoundingSurprise = card(213061, "character")
  .costPyro(3)
  .talentOf(Klee)
  .equipment()
  // TODO
  .done();
