import { character, skill, summon, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 122013
 * @name 纯水幻形·蛙
 * @description
 * 我方出战角色受到伤害时：抵消1点伤害。
 * 可用次数：2，耗尽时不弃置此牌。
 * 结束阶段，如果可用次数已耗尽：弃置此牌，以造成2点水元素伤害。
 */
const OceanicMimicFrog = summon(122013)
  // TODO
  .done();

/**
 * @id 122012
 * @name 纯水幻形·飞鸢
 * @description
 * 结束阶段：造成1点水元素伤害。
 * 可用次数：3
 */
const OceanicMimicRaptor = summon(122012)
  // TODO
  .done();

/**
 * @id 122011
 * @name 纯水幻形·花鼠
 * @description
 * 结束阶段：造成2点水元素伤害。
 * 可用次数：2
 */
const OceanicMimicSquirrel = summon(122011)
  // TODO
  .done();

/**
 * @id 22011
 * @name 翻涌
 * @description
 * 造成1点水元素伤害。
 */
const Surge = skill(22011)
  .type("normal")
  .costHydro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 22012
 * @name 纯水幻造
 * @description
 * 随机召唤1种纯水幻形。（优先生成不同的类型）
 */
const OceanidMimicSummoning = skill(22012)
  .type("elemental")
  .costHydro(3)
  // TODO
  .done();

/**
 * @id 22013
 * @name 林野百态
 * @description
 * 随机召唤2种纯水幻形。（优先生成不同的类型）
 */
const TheMyriadWilds = skill(22013)
  .type("elemental")
  .costHydro(5)
  // TODO
  .done();

/**
 * @id 22014
 * @name 潮涌与激流
 * @description
 * 造成4点水元素伤害；我方每有1个召唤物，再使此伤害+1。
 */
const TideAndTorrent = skill(22014)
  .type("burst")
  .costHydro(3)
  .costEnergy(3)
  // TODO
  .done();

/**
 * @id 2201
 * @name 纯水精灵·洛蒂娅
 * @description
 * 「但，只要百川奔流，雨露不休，水就不会消失…」
 */
const RhodeiaOfLoch = character(2201)
  .tags("hydro", "monster")
  .skills(Surge, OceanidMimicSummoning, TheMyriadWilds, TideAndTorrent)
  .done();

/**
 * @id 222011
 * @name 百川奔流
 * @description
 * 战斗行动：我方出战角色为纯水精灵·洛蒂娅时，装备此牌。
 * 纯水精灵·洛蒂娅装备此牌后，立刻使用一次潮涌与激流。
 * 装备有此牌的纯水精灵·洛蒂娅使用潮涌与激流时：我方所有召唤物可用次数+1。
 * （牌组中包含纯水精灵·洛蒂娅，才能加入牌组）
 */
const StreamingSurge = card(222011, "character")
  .costHydro(4)
  .costEnergy(3)
  .talentOf(RhodeiaOfLoch)
  .equipment()
  // TODO
  .done();
