import { character, skill, combatStatus, card, DamageType } from "@gi-tcg";

/**
 * @id 112022
 * @name 虹剑势
 * @description
 * 我方角色普通攻击后：造成1点水元素伤害。
 * 可用次数：3
 */
const RainbowBladework = combatStatus(112022)
  // TODO
  .done();

/**
 * @id 112023
 * @name 雨帘剑
 * @description
 * 我方出战角色受到至少为2的伤害时：抵消1点伤害。
 * 可用次数：3
 */
const RainSword = combatStatus(112023)
  // TODO
  .done();

/**
 * @id 112021
 * @name 雨帘剑
 * @description
 * 我方出战角色受到至少为3的伤害时：抵消1点伤害。
 * 可用次数：2
 */
const RainSword = combatStatus(112021)
  // TODO
  .done();

/**
 * @id 12021
 * @name 古华剑法
 * @description
 * 造成2点物理伤害。
 */
const GuhuaStyle = skill(12021)
  .type("normal")
  .costHydro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 12022
 * @name 画雨笼山
 * @description
 * 造成2点水元素伤害，本角色附着水元素，生成雨帘剑。
 */
const FatalRainscreen = skill(12022)
  .type("elemental")
  .costHydro(3)
  // TODO
  .done();

/**
 * @id 12023
 * @name 裁雨留虹
 * @description
 * 造成2点水元素伤害，本角色附着水元素，生成虹剑势。
 */
const Raincutter = skill(12023)
  .type("burst")
  .costHydro(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 1202
 * @name 行秋
 * @description
 * 「怎么最近小说里的主角，都是些私塾里的学生…」
 */
const Xingqiu = character(1202)
  .tags("hydro", "sword", "liyue")
  .skills(GuhuaStyle, FatalRainscreen, Raincutter)
  .done();

/**
 * @id 212021
 * @name 重帘留香
 * @description
 * 战斗行动：我方出战角色为行秋时，装备此牌。
 * 行秋装备此牌后，立刻使用一次画雨笼山。
 * 装备有此牌的行秋生成的雨帘剑改为可以抵挡至少为2的伤害，并且初始可用次数+1。
 * （牌组中包含行秋，才能加入牌组）
 */
const TheScentRemained = card(212021, "character")
  .costHydro(3)
  .talentOf(Xingqiu)
  .equipment()
  // TODO
  .done();
