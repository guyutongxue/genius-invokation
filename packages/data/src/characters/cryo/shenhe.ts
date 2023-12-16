import { character, skill, summon, combatStatus, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 111073
 * @name 箓灵
 * @description
 * 结束阶段：造成1点冰元素伤害。
 * 可用次数：2
 * 此召唤物在场时：敌方角色受到的冰元素伤害和物理伤害+1。
 */
const TalismanSpirit = summon(111073)
  // TODO
  .done();

/**
 * @id 111072
 * @name 冰翎
 * @description
 * 我方角色造成的冰元素伤害+1。（包括角色引发的冰元素扩散的伤害）
 * 可用次数：2
 * 我方角色通过「普通攻击」触发此效果时，不消耗可用次数。（每回合1次）
 */
const IcyQuill01 = combatStatus(111072)
  // TODO
  .done();

/**
 * @id 111071
 * @name 冰翎
 * @description
 * 我方角色造成的冰元素伤害+1。（包括角色引发的冰元素扩散的伤害）
 * 可用次数：2
 */
const IcyQuill = combatStatus(111071)
  // TODO
  .done();

/**
 * @id 11071
 * @name 踏辰摄斗
 * @description
 * 造成2点物理伤害。
 */
const DawnstarPiercer = skill(11071)
  .type("normal")
  .costCryo(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 11072
 * @name 仰灵威召将役咒
 * @description
 * 造成2点冰元素伤害，生成冰翎。
 */
const SpringSpiritSummoning = skill(11072)
  .type("elemental")
  .costCryo(3)
  // TODO
  .done();

/**
 * @id 11073
 * @name 神女遣灵真诀
 * @description
 * 造成1点冰元素伤害，召唤箓灵。
 */
const DivineMaidensDeliverance = skill(11073)
  .type("burst")
  .costCryo(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 1107
 * @name 申鹤
 * @description
 * 红尘渺渺，因果烟消。
 */
const Shenhe = character(1107)
  .tags("cryo", "pole", "liyue")
  .health(10)
  .energy(2)
  .skills(DawnstarPiercer, SpringSpiritSummoning, DivineMaidensDeliverance)
  .done();

/**
 * @id 211071
 * @name 忘玄
 * @description
 * 战斗行动：我方出战角色为申鹤时，装备此牌。
 * 申鹤装备此牌后，立刻使用一次仰灵威召将役咒。
 * 装备有此牌的申鹤生成的冰翎被我方角色的「普通攻击」触发时：不消耗可用次数。（每回合1次）
 * （牌组中包含申鹤，才能加入牌组）
 */
const MysticalAbandon = card(211071)
  .costCryo(3)
  .talentOf(Shenhe)
  .equipment()
  // TODO
  .done();
