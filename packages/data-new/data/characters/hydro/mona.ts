import { createCard, createCharacter, createSkill, createStatus, createSummon, DamageType } from "@gi-tcg";

/**
 * **因果点破**
 * 造成1点水元素伤害。
 */
const RippleOfFate = createSkill(12031)
  .setType("normal")
  .costHydro(1)
  .costVoid(2)
  .dealDamage(1, DamageType.Hydro)
  .build();

/**
 * **虚影**
 * 我方出战角色受到伤害时：抵消1点伤害。
 * 可用次数：1，耗尽时不弃置此牌。
 * 结束阶段：弃置此牌，造成1点水元素伤害。
 */
const Reflection = createSummon(112031)
  .withUsage(1)
  .noDispose()
  .on("endPhase", (c) => {
    c.dealDamage(1, DamageType.Hydro);
    c.dispose();
  })
  .build();

/**
 * **水中幻愿**
 * 造成1点水元素伤害，召唤虚影。
 */
const MirrorReflectionOfDoom = createSkill(12032)
  .setType("elemental")
  .costHydro(3)
  .dealDamage(1, DamageType.Hydro)
  .summon(Reflection)
  .build();

/**
 * **泡影**
 * 我方造成技能伤害时：移除此状态，使本次伤害加倍。
 */
const IllusoryBubble = createStatus(112032)
  .withUsage(1)
  .on("beforeUseSkill", (c) => {
    if (c.damage) {
      c.damage.multiplyDamage(2, /* order: */ 6);
    } else {
      return false;
    }
  })
  .build();

/**
 * **星命定轨**
 * 造成4点水元素伤害，生成泡影。
 */
const StellarisPhantasm = createSkill(12033)
  .setType("burst")
  .costHydro(3)
  .costEnergy(3)
  .dealDamage(4, DamageType.Hydro)
  .createCombatStatus(IllusoryBubble)
  .build();

/**
 * **虚实流动**
 * 【被动】此角色为出战角色，我方执行「切换角色」行动时：将此次切换视为「快速行动」而非「战斗行动」。（每回合1次）
 */
const IllusoryTorrent = createSkill(12034)
  .setType("passive")
  .withUsagePerRound(1)
  .on("requestFastSwitchActive", (c) => c.getMaster().isActive())
  .build();

export const Mona = createCharacter(1203)
  .addTags("hydro", "catalyst", "mondstadt")
  .addSkills(RippleOfFate, MirrorReflectionOfDoom, StellarisPhantasm, IllusoryTorrent)
  .build();

/**
 * **沉没的预言**
 * 战斗行动：我方出战角色为莫娜时，装备此牌。
 * 莫娜装备此牌后，立刻使用一次星命定轨。
 * 装备有此牌的莫娜出战期间，我方引发的水元素相关反应伤害额外+2。
 * （牌组中包含莫娜，才能加入牌组）
 */
export const ProphecyOfSubmersion = createCard(212031)
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(Mona)
  .addActiveCharacterFilter(Mona)
  .costHydro(3)
  .costEnergy(3)
  .useSkill(StellarisPhantasm)
  .buildToEquipment()
  .listenToOther()
  .on("beforeDealDamage", (c) => {
    if (c.getMaster().isActive() && c.reaction?.relatedWith(DamageType.Hydro)) {
      c.addDamage(2);
    }
  })
  .build();
