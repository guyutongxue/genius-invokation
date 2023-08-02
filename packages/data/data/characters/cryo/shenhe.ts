import { createCard, createCharacter, createSkill, createStatus, createSummon, DamageType } from "@gi-tcg";

/**
 * **踏辰摄斗**
 * 造成2点物理伤害。
 */
const DawnstarPiercer = createSkill(11071)
  .setType("normal")
  .costCryo(1)
  .costVoid(2)
  .dealDamage(2, DamageType.Physical)
  .build();

/**
 * **冰翎**
 * 我方角色造成的冰元素伤害+1。（包括角色引发的冰元素扩散的伤害）
 * 可用次数：3
 */
const IceQuill = createStatus(111071)
  .withUsage(3)
  .on("enter", (c) => { c.findCombatStatus(IceQuill01)?.dispose(); })
  .on("beforeDealDamage",
    (c) => !!c.sourceSkill && c.damageType === DamageType.Cryo,
    (c) => { c.addDamage(1); })
  .build();

/**
 * **冰翎**
 * 我方角色造成的冰元素伤害+1。（包括角色引发的冰元素扩散的伤害）
 * 可用次数：3
 * 我方角色通过「普通攻击」触发此效果时，不消耗可用次数。（每回合1次）
 */
const IceQuill01 = createStatus(111071)
  .withUsage(3)
  .on("enter", (c) => { c.findCombatStatus(IceQuill)?.dispose(); })
  .on("beforeDealDamage",
    (c) => !!c.sourceSkill && c.damageType === DamageType.Cryo,
    (c) => {
      c.addDamage(1);
      if (c.sourceSkill!.info.type === "normal") {
        return false;
      }
    })
  .build();


/**
 * **仰灵威召将役咒**
 * 造成2点冰元素伤害，生成冰翎。
 */
const SpringSpiritSummoning = createSkill(11072)
  .setType("elemental")
  .costCryo(3)
  .dealDamage(2, DamageType.Cryo)
  .do((c) => {
    if (c.character.findEquipment(MysticalAbandon)) {
      c.character.createStatus(IceQuill01);
    } else {
      c.character.createStatus(IceQuill);
    }
  })
  .build();

/**
 * **箓灵**
 * 结束阶段：造成1点冰元素伤害。
 * 可用次数：2
 * 此召唤物在场时：敌方角色受到的冰元素伤害和物理伤害+1。
 */
const TalismanSpirit = createSummon(111073)
  .withUsage(2)
  .listenToOpp()
  .on("endPhase", (c) => {
    c.dealDamage(1, DamageType.Cryo);
  })
  .on("beforeDamaged",
    (c) => !c.target.isMine() && (c.damageType === DamageType.Physical || c.damageType === DamageType.Cryo),
    (c) => {
      c.addDamage(1);
      return false;
    })
  .build();

/**
 * **神女遣灵真诀**
 * 造成1点冰元素伤害，召唤箓灵。
 */
const DivineMaidensDeliverance = createSkill(11073)
  .setType("burst")
  .costCryo(3)
  .costEnergy(2)
  .dealDamage(1, DamageType.Cryo)
  .summon(TalismanSpirit)
  .build();

export const Shenhe = createCharacter(1107)
  .addTags("cryo", "pole", "liyue")
  .maxEnergy(2)
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
  .requireCharacter(Shenhe)
  .addCharacterFilter(Shenhe)
  .costCryo(3)
  .buildToEquipment()
  .on("enter", (c) => { c.useSkill(SpringSpiritSummoning); })
  .build();
