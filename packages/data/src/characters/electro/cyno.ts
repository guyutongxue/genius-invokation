import { character, skill, status, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 114041
 * @name 启途誓使
 * @description
 * 结束阶段：累积1级「凭依」。
 * 根据「凭依」级数，提供效果：
 * 大于等于2级：物理伤害转化为雷元素伤害；
 * 大于等于4级：造成的伤害+2；
 * 大于等于6级时：「凭依」级数-4。
 */
const PactswornPathclearer = status(114041)
  // TODO
  .done();

/**
 * @id 14041
 * @name 七圣枪术
 * @description
 * 造成2点物理伤害。
 */
const InvokersSpear = skill(14041)
  .type("normal")
  .costElectro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 14042
 * @name 秘仪·律渊渡魂
 * @description
 * 造成3点雷元素伤害。
 */
const SecretRiteChasmicSoulfarer = skill(14042)
  .type("elemental")
  .costElectro(3)
  // TODO
  .done();

/**
 * @id 14043
 * @name 圣仪·煟煌随狼行
 * @description
 * 造成4点雷元素伤害，
 * 启途誓使的[凭依]级数+2。
 */
const SacredRiteWolfsSwiftness = skill(14043)
  .type("burst")
  .costElectro(4)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 14044
 * @name 行度誓惩
 * @description
 * 【被动】战斗开始时，初始附属启途誓使。
 */
const LawfulEnforcer = skill(14044)
  .type("passive")
  // TODO
  .done();

/**
 * @id 1404
 * @name 赛诺
 * @description
 * 卡牌中蕴藏的，是大风纪官如沙漠烈日般炙热的喜爱之情。
 */
const Cyno = character(1404)
  .tags("electro", "pole", "sumeru")
  .skills(InvokersSpear, SecretRiteChasmicSoulfarer, SacredRiteWolfsSwiftness, LawfulEnforcer)
  .done();

/**
 * @id 214041
 * @name 落羽的裁择
 * @description
 * 战斗行动：我方出战角色为赛诺时，装备此牌。
 * 赛诺装备此牌后，立刻使用一次秘仪·律渊渡魂。
 * 装备有此牌的赛诺在启途誓使的「凭依」级数为偶数时，使用秘仪·律渊渡魂造成的伤害+1。
 * （牌组中包含赛诺，才能加入牌组）
 */
const FeatherfallJudgment = card(214041)
  .costElectro(3)
  .talentOf(Cyno)
  .equipment()
  // TODO
  .done();
