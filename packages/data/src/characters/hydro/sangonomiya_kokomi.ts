import { character, skill, summon, status, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 112051
 * @name 化海月
 * @description
 * 结束阶段：造成1点水元素伤害，治疗我方出战角色1点。
 * 可用次数：2
 */
const BakeKurage = summon(112051)
  // TODO
  .done();

/**
 * @id 112052
 * @name 仪来羽衣
 * @description
 * 所附属角色普通攻击造成的伤害+1。
 * 所附属角色普通攻击后：治疗所有我方角色1点。
 * 持续回合：2
 */
const CeremonialGarment = status(112052)
  // TODO
  .done();

/**
 * @id 12051
 * @name 水有常形
 * @description
 * 造成1点水元素伤害。
 */
const TheShapeOfWater = skill(12051)
  .type("normal")
  .costHydro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 12052
 * @name 海月之誓
 * @description
 * 本角色附着水元素，召唤化海月。
 */
const KuragesOath = skill(12052)
  .type("elemental")
  .costHydro(3)
  // TODO
  .done();

/**
 * @id 12053
 * @name 海人化羽
 * @description
 * 造成2点水元素伤害，治疗所有我方角色1点，本角色附属仪来羽衣。
 */
const NereidsAscension = skill(12053)
  .type("burst")
  .costHydro(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 1205
 * @name 珊瑚宫心海
 * @description
 * 未雨绸缪，临危莫乱。
 */
const SangonomiyaKokomi = character(1205)
  .tags("hydro", "catalyst", "inazuma")
  .health(10)
  .energy(2)
  .skills(TheShapeOfWater, KuragesOath, NereidsAscension)
  .done();

/**
 * @id 212051
 * @name 匣中玉栉
 * @description
 * 战斗行动：我方出战角色为珊瑚宫心海时，装备此牌。
 * 珊瑚宫心海装备此牌后，立刻使用一次海人化羽。
 * 装备有此牌的珊瑚宫心海使用海人化羽时：召唤一个可用次数为1的化海月；如果化海月已在场，则改为使其可用次数+1。
 * 仪来羽衣存在期间，化海月造成的伤害+1。
 * （牌组中包含珊瑚宫心海，才能加入牌组）
 */
const TamakushiCasket = card(212051)
  .costHydro(3)
  .costEnergy(2)
  .talent(SangonomiyaKokomi)
  // TODO
  .done();
