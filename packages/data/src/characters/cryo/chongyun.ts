import { character, skill, combatStatus, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 111042
 * @name 重华叠霜领域
 * @description
 * 我方单手剑、双手剑或长柄武器角色造成的物理伤害变为冰元素伤害，普通攻击造成的伤害+1。
 * 持续回合：2
 */
const ChonghuaFrostField01 = combatStatus(111042)
  // TODO
  .done();

/**
 * @id 111041
 * @name 重华叠霜领域
 * @description
 * 我方单手剑、双手剑或长柄武器角色造成的物理伤害变为冰元素伤害。
 * 持续回合：2
 */
const ChonghuaFrostField = combatStatus(111041)
  // TODO
  .done();

/**
 * @id 11041
 * @name 灭邪四式
 * @description
 * 造成2点物理伤害。
 */
const Demonbane = skill(11041)
  .type("normal")
  .costCryo(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 11042
 * @name 重华叠霜
 * @description
 * 造成3点冰元素伤害，生成重华叠霜领域。
 */
const ChonghuasLayeredFrost = skill(11042)
  .type("elemental")
  .costCryo(3)
  // TODO
  .done();

/**
 * @id 11043
 * @name 云开星落
 * @description
 * 造成7点冰元素伤害。
 */
const CloudpartingStar = skill(11043)
  .type("burst")
  .costCryo(3)
  .costEnergy(3)
  // TODO
  .done();

/**
 * @id 1104
 * @name 重云
 * @description
 * 「夏天啊，你还是悄悄过去吧…」
 */
const Chongyun = character(1104)
  .tags("cryo", "claymore", "liyue")
  .health(10)
  .energy(3)
  .skills(Demonbane, ChonghuasLayeredFrost, CloudpartingStar)
  .done();

/**
 * @id 211041
 * @name 吐纳真定
 * @description
 * 战斗行动：我方出战角色为重云时，装备此牌。
 * 重云装备此牌后，立刻使用一次重华叠霜。
 * 装备有此牌的重云生成的重华叠霜领域获得以下效果：
 * 使我方单手剑、双手剑或长柄武器角色的普通攻击伤害+1。
 * （牌组中包含重云，才能加入牌组）
 */
const SteadyBreathing = card(211041)
  .costCryo(3)
  .talentOf(Chongyun)
  .equipment()
  // TODO
  .done();
