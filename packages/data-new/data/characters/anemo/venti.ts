import { character, skill, summon, combatStatus, card, DamageType } from "@gi-tcg";

/**
 * @id 115034
 * @name 暴风之眼
 * @description
 * 结束阶段：造成2点风元素伤害，对方切换到距离我方出战角色最近的角色。
 * 可用次数：2
 * 我方角色或召唤物引发扩散反应后：转换此牌的元素类型，改为造成被扩散的元素类型的伤害。（离场前仅限一次）
 */
const Stormeye = summon(115034)
  // TODO
  .done();

/**
 * @id 115032
 * @name 风域
 * @description
 * 我方执行「切换角色」行动时：少花费1个元素骰。触发该效果后，使本回合中我方角色下次「普通攻击」少花费1个无色元素。
 * 可用次数：2
 */
const Stormzone = combatStatus(115032)
  // TODO
  .done();

/**
 * @id 115031
 * @name 风域
 * @description
 * 我方执行「切换角色」行动时：少花费1个元素骰。
 * 可用次数：2
 */
const Stormzone = combatStatus(115031)
  // TODO
  .done();

/**
 * @id 115033
 * @name 协鸣之风
 * @description
 * 本回合中，我方角色下次「普通攻击」少花费1个无色元素。
 */
const WindsOfHarmony = combatStatus(115033)
  // TODO
  .done();

/**
 * @id 15031
 * @name 神代射术
 * @description
 * 造成2点物理伤害。
 */
const DivineMarksmanship = skill(15031)
  .type("normal")
  .costAnemo(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 15032
 * @name 高天之歌
 * @description
 * 造成2点风元素伤害，生成风域。
 */
const SkywardSonnet = skill(15032)
  .type("elemental")
  .costAnemo(3)
  // TODO
  .done();

/**
 * @id 15033
 * @name 风神之诗
 * @description
 * 造成2点风元素伤害，召唤暴风之眼。
 */
const WindsGrandOde = skill(15033)
  .type("burst")
  .costAnemo(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 1503
 * @name 温迪
 * @description
 * 「四季轮转，四风从不止息。」
 * 「当然啦，功劳也不是它们的，主要是我的。」
 * 「要是没有吟游诗人，谁去把这些传唱？」
 */
const Venti = character(1503)
  .tags("anemo", "bow", "mondstadt")
  .skills(DivineMarksmanship, SkywardSonnet, WindsGrandOde)
  .done();

/**
 * @id 215031
 * @name 绪风之拥
 * @description
 * 战斗行动：我方出战角色为温迪时，装备此牌。
 * 温迪装备此牌后，立刻使用一次高天之歌。
 * 装备有此牌的温迪生成的风域触发后，会使本回合中我方角色下次「普通攻击」少花费1个无色元素。
 * （牌组中包含温迪，才能加入牌组）
 */
const EmbraceOfWinds = card(215031, "character")
  .costAnemo(3)
  .talentOf(Venti)
  .equipment()
  // TODO
  .done();
