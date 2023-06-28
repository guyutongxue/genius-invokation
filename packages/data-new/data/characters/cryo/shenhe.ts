import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **踏辰摄斗**
 * 造成2点物理伤害。
 */
const DawnstarPiercer = createSkill(11071)
  .setType("normal")
  .costCryo(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **仰灵威召将役咒**
 * 造成2点冰元素伤害，生成冰翎。
 */
const SpringSpiritSummoning = createSkill(11072)
  .setType("elemental")
  .costCryo(3)
  // TODO
  .build();

/**
 * **神女遣灵真诀**
 * 造成1点冰元素伤害，召唤箓灵。
 */
const DivineMaidensDeliverance = createSkill(11073)
  .setType("burst")
  .costCryo(3)
  .costEnergy(2)
  // TODO
  .build();

export const Shenhe = createCharacter(1107)
  .addTags("cryo", "pole", "liyue")
  .addSkills(DawnstarPiercer, SpringSpiritSummoning, DivineMaidensDeliverance)
  .build();

/**
 * **忘玄**
 * 战斗行动：我方出战角色为申鹤时，装备此牌。
 * 申鹤装备此牌后，立刻使用一次仰灵威召将役咒。
 * 装备有此牌的申鹤生成的冰翎被我方角色的「普通攻击」触发时：不消耗可用次数。（每回合1次）
 * （牌组中包含申鹤，才能加入牌组）
 */
export const MysticalAbandon = createCard(211071, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .costCryo(3)
  // TODO
  .build();