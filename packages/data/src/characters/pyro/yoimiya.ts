import { character, skill, status, combatStatus, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 113053
 * @name 庭火焰硝
 * @description
 * 所附属角色普通攻击伤害+1，造成的物理伤害变为火元素伤害。
 * 所附属角色使用普通攻击后：造成1点火元素伤害。
 * 可用次数：3
 */
const NiwabiEnshou01 = status(113053)
  // TODO
  .done();

/**
 * @id 113051
 * @name 庭火焰硝
 * @description
 * 所附属角色普通攻击伤害+1，造成的物理伤害变为火元素伤害。
 * 可用次数：2
 */
const NiwabiEnshou = status(113051)
  // TODO
  .done();

/**
 * @id 113052
 * @name 琉金火光
 * @description
 * 宵宫以外的我方角色使用技能后：造成1点火元素伤害。
 * 持续回合：2
 */
const AurousBlaze = combatStatus(113052)
  // TODO
  .done();

/**
 * @id 13051
 * @name 烟火打扬
 * @description
 * 造成2点物理伤害。
 */
const FireworkFlareup = skill(13051)
  .type("normal")
  .costPyro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 13052
 * @name 焰硝庭火舞
 * @description
 * 本角色附属庭火焰硝。（此技能不产生充能）
 */
const NiwabiFiredance = skill(13052)
  .type("elemental")
  .costPyro(1)
  // TODO
  .done();

/**
 * @id 13053
 * @name 琉金云间草
 * @description
 * 造成3点火元素伤害，生成琉金火光。
 */
const RyuukinSaxifrage = skill(13053)
  .type("burst")
  .costPyro(3)
  .costEnergy(3)
  // TODO
  .done();

/**
 * @id 1305
 * @name 宵宫
 * @description
 * 花见坂第十一届全街邀请赛「长野原队」队长兼首发牌手。
 */
const Yoimiya = character(1305)
  .tags("pyro", "bow", "inazuma")
  .skills(FireworkFlareup, NiwabiFiredance, RyuukinSaxifrage)
  .done();

/**
 * @id 213051
 * @name 长野原龙势流星群
 * @description
 * 战斗行动：我方出战角色为宵宫时，装备此牌。
 * 宵宫装备此牌后，立刻使用一次焰硝庭火舞。
 * 装备有此牌的宵宫所生成的庭火焰硝初始可用次数+1，并且触发后额外造成1点火元素伤害。
 * （牌组中包含宵宫，才能加入牌组）
 */
const NaganoharaMeteorSwarm = card(213051, "character")
  .costPyro(2)
  .talentOf(Yoimiya)
  .equipment()
  // TODO
  .done();
