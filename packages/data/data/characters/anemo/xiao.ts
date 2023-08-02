import { createCard, createCharacter, createSkill, createStatus, DamageType, DiceType } from "@gi-tcg";

/**
 * **卷积微尘**
 * 造成2点物理伤害。
 */
const WhirlwindThrust = createSkill(15041)
  .setType("normal")
  .costAnemo(1)
  .costVoid(2)
  .dealDamage(2, DamageType.Physical)
  .build();

/**
 * **风轮两立**
 * 造成3点风元素伤害。
 */
const LemniscaticWindCycling = createSkill(15042)
  .setType("elemental")
  .costAnemo(3)
  .dealDamage(3, DamageType.Anemo)
  .build();

/**
 * **夜叉傩面**
 * 所附属角色造成的物理伤害变为风元素伤害，且角色造成的风元素伤害+1。
 * 所附属角色进行下落攻击时：伤害额外+2。
 * 所附属角色为出战角色，我方执行「切换角色」行动时：少花费1个元素骰。（每回合1次）
 * 持续回合：2
 */
const YakshaMask = createStatus(115041)
  .withDuration(2)
  .withThis({ deductCost: false })
  .on("earlyBeforeDealDamage", (c) => {
    if (c.damageType === DamageType.Physical) {
      c.changeDamageType(DamageType.Anemo);
    }
  })
  .on("beforeDealDamage", (c) => {
    if (c.damageType === DamageType.Anemo) {
      c.addDamage(1);
    }
    if (c.sourceSkill?.plunging) {
      c.addDamage(2);
    }
  })
  .on("beforeUseDice",
    (c) => c.this.deductCost && !!c.switchActiveCtx && c.this.master!.isActive(),
    (c) => {
      c.deductCost(DiceType.Omni);
    })
  .on("actionPhase", (c) => { c.this.deductCost = true; })
  .build();

/**
 * **靖妖傩舞**
 * 造成4点风元素伤害，本角色附属夜叉傩面。
 */
const BaneOfAllEvil = createSkill(15043)
  .setType("burst")
  .costAnemo(3)
  .costEnergy(2)
  .dealDamage(4, DamageType.Anemo)
  .createCharacterStatus(YakshaMask)
  .build();

export const Xiao = createCharacter(1504)
  .addTags("anemo", "pole", "liyue")
  .maxEnergy(2)
  .addSkills(WhirlwindThrust, LemniscaticWindCycling, BaneOfAllEvil)
  .build();

/**
 * **降魔·护法夜叉**
 * 战斗行动：我方出战角色为魈时，装备此牌。
 * 魈装备此牌后，立刻使用一次靖妖傩舞。
 * 装备有此牌的魈附属夜叉傩面期间，使用风轮两立时少花费1个风元素。（每附属1次夜叉傩面，可触发2次）
 * （牌组中包含魈，才能加入牌组）
 */
export const ConquerorOfEvilGuardianYaksha = createCard(215041, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(Xiao)
  .addCharacterFilter(Xiao)
  .costAnemo(3)
  .costEnergy(2)
  .buildToEquipment()
  .on("enter", (c) => { c.useSkill(BaneOfAllEvil); })
  .on("useSkill",
    (c) => c.info.id === BaneOfAllEvil,
    (c) => { c.this.master.createStatus(ConquerorOfEvilWrathDeity) })
  .build();

/**
 * **降魔·忿怒显相**
 * 所附属角色使用风轮两立时：少花费1个风元素。
 * 可用次数：2
 * 所附属角色不再附属夜叉傩面时：移除此效果。
 */
const ConquerorOfEvilWrathDeity = createStatus(115042)
  .withUsage(2)
  .withDuration(2) // 夜叉傩面持续回合
  .on("beforeUseDice", 
    (c) => c.useSkillCtx?.info.id === LemniscaticWindCycling,
    (c) => {
      c.deductCost(DiceType.Anemo);
    })
  .build();
