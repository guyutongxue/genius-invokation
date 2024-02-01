import { character, skill, status, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 117061
 * @name 琢光镜
 * @description
 * 角色造成的物理伤害变为草元素伤害。
 * 角色普通攻击后：造成1点草元素伤害。如果此技能为重击，则使此状态的持续回合+1。
 * 持续回合：2（可叠加，最多叠加到3回合）
 */
export const ChisellightMirror = status(117061)
  // TODO
  .done();

/**
 * @id 17061
 * @name 溯因反绎法
 * @description
 * 造成2点物理伤害。
 */
export const AbductiveReasoning = skill(17061)
  .type("normal")
  .costDendro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 17062
 * @name 共相·理式摹写
 * @description
 * 造成2点草元素伤害，本角色附属琢光镜。
 */
export const UniversalityAnElaborationOnForm = skill(17062)
  .type("elemental")
  .costDendro(3)
  // TODO
  .done();

/**
 * @id 17063
 * @name 殊境·显象缚结
 * @description
 * 造成4点草元素伤害；消耗琢光镜，此伤害提升所消耗琢光镜的持续回合值。
 * 如果消耗琢光镜的持续回合为0/1/2，则为角色附属持续回合为3/2/1的琢光镜。
 */
export const ParticularFieldFettersOfPhenomena = skill(17063)
  .type("burst")
  .costDendro(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 1706
 * @name 艾尔海森
 * @description
 * 学识、思考及处事之道。
 */
export const Alhaitham = character(1706)
  .tags("dendro", "sword", "sumeru")
  .health(10)
  .energy(2)
  .skills(AbductiveReasoning, UniversalityAnElaborationOnForm, ParticularFieldFettersOfPhenomena)
  .done();

/**
 * @id 217061
 * @name 正理
 * @description
 * 战斗行动：我方出战角色为艾尔海森时，装备此牌。
 * 艾尔海森装备此牌后，立刻使用一次殊境·显象缚结。
 * 装备有此牌的艾尔海森使用殊境·显象缚结时：如果消耗了持续回合至少为1的琢光镜，则总是附属持续回合为3的琢光镜，并且抓1张牌。
 * （牌组中包含艾尔海森，才能加入牌组）
 */
export const Structuration = card(217061)
  .costDendro(3)
  .costEnergy(2)
  .talent(Alhaitham)
  // TODO
  .done();
