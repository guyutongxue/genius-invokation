import { character, skill, summon, status, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 123032
 * @name 厄灵·炎之魔蝎
 * @description
 * 结束阶段：造成1点火元素伤害；如果本回合中镀金旅团·炽沙叙事人使用过「普通攻击」或「元素战技」，则此伤害+1。
 * 可用次数：2
 * 入场时和行动阶段开始：使我方镀金旅团·炽沙叙事人附属炎之魔蝎·守势。（厄灵·炎之魔蝎在场时每回合至多2次，使角色受到的伤害-1。）
 */
const SpiritOfOmenPyroScorpion01 = summon(123032)
  // TODO
  .done();

/**
 * @id 123031
 * @name 厄灵·炎之魔蝎
 * @description
 * 结束阶段：造成1点火元素伤害。
 * 可用次数：2
 * 入场时和行动阶段开始：使我方镀金旅团·炽沙叙事人附属炎之魔蝎·守势。（厄灵·炎之魔蝎在场时每回合1次，使角色受到的伤害-1。）
 */
const SpiritOfOmenPyroScorpion = summon(123031)
  // TODO
  .done();

/**
 * @id 123034
 * @name 炎之魔蝎·守势
 * @description
 * 厄灵·炎之魔蝎在场时：所附属角色受到的伤害-1。（每回合至多2次）
 */
const PyroScorpionGuardianStanceStatus01 = status(123034)
  // TODO
  .done();

/**
 * @id 123033
 * @name 炎之魔蝎·守势
 * @description
 * 厄灵·炎之魔蝎在场时：所附属角色受到的伤害-1。（每回合1次）
 */
const PyroScorpionGuardianStanceStatus = status(123033)
  // TODO
  .done();

/**
 * @id 23031
 * @name 烧蚀之光
 * @description
 * 造成1点火元素伤害。
 */
const SearingGlare = skill(23031)
  .type("normal")
  .costPyro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 23032
 * @name 炎晶迸击
 * @description
 * 造成3点火元素伤害。
 */
const BlazingStrike = skill(23032)
  .type("elemental")
  .costPyro(3)
  // TODO
  .done();

/**
 * @id 23033
 * @name 厄灵苏醒·炎之魔蝎
 * @description
 * 造成2点火元素伤害，召唤厄灵·炎之魔蝎。
 */
const SpiritOfOmensAwakeningPyroScorpion = skill(23033)
  .type("burst")
  .costPyro(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 23034
 * @name 厄灵之能
 * @description
 * 【被动】此角色受到伤害后：如果此角色生命值不多于7，则获得1点充能。（整场牌局限制1次）
 */
const SpiritOfOmensPower = skill(23034)
  .type("passive")
  // TODO
  .done();

/**
 * @id 23035
 * @name 
 * @description
 * 每回合开始将此角色计数器清零
 */
const _23035 = skill(23035)
  // .type("undefined")
  // TODO
  .done();

/**
 * @id 23036
 * @name 炎之魔蝎·守势
 * @description
 * 每回合开始如果场上存在召唤物刷新盾
 */
const PyroScorpionGuardianStance = skill(23036)
  // .type("undefined")
  // TODO
  .done();

/**
 * @id 23037
 * @name 炎之魔蝎·守势
 * @description
 * 每回合开始如果场上存在召唤物刷新盾（天赋）
 */
const PyroScorpionGuardianStance01 = skill(23037)
  // .type("undefined")
  // TODO
  .done();

/**
 * @id 2303
 * @name 镀金旅团·炽沙叙事人
 * @description
 * 如今仍然能记起许多故事的人，是不会背叛流淌在体内的沙漠血脉的。
 */
const EremiteScorchingLoremaster = character(2303)
  .tags("pyro", "eremite")
  .health(10)
  .energy(2)
  .skills(SearingGlare, BlazingStrike, SpiritOfOmensAwakeningPyroScorpion, SpiritOfOmensPower, _23035, PyroScorpionGuardianStance, PyroScorpionGuardianStance01)
  .done();

/**
 * @id 223031
 * @name 魔蝎烈祸
 * @description
 * 战斗行动：我方出战角色为镀金旅团·炽沙叙事人时，装备此牌。
 * 镀金旅团·炽沙叙事人装备此牌后，立刻使用一次厄灵苏醒·炎之魔蝎。
 * 装备有此牌的镀金旅团·炽沙叙事人生成的厄灵·炎之魔蝎在镀金旅团·炽沙叙事人使用过「普通攻击」或「元素战技」的回合中，造成的伤害+1；
 * 厄灵·炎之魔蝎的减伤效果改为每回合至多2次。
 * （牌组中包含镀金旅团·炽沙叙事人，才能加入牌组）
 */
const Scorpocalypse = card(223031)
  .costPyro(3)
  .costEnergy(2)
  .talent(EremiteScorchingLoremaster)
  // TODO
  .done();
