import { createCard, createCharacter, createSkill, createStatus, DamageType, DiceType } from "@gi-tcg";

/**
 * **西风剑术·女仆**
 * 造成2点物理伤害。
 */
const FavoniusBladeworkMaid = createSkill(16021)
  .setType("normal")
  .costGeo(1)
  .costVoid(2)
  .dealDamage(2, DamageType.Physical)
  .build();

/**
 * **护体岩铠**
 * 为我方出战角色提供2点护盾。
 * 此护盾耗尽前，我方受到的物理伤害减半。（向上取整）
 */
const FullPlate = createStatus(116021)
  .shield(2)
  .on("beforeDamaged", (c) => {
    if (c.damageType === DamageType.Physical) {
      c.multiplyDamage(0.5);
    }
  })
  .build();

/**
 * **护心铠**
 * 造成1点岩元素伤害，生成护体岩铠。
 */
const Breastplate = createSkill(16022)
  .setType("elemental")
  .costGeo(3)
  .dealDamage(1, DamageType.Geo)
  .createCombatStatus(FullPlate)
  .build();

/**
 * **大扫除**
 * 角色使用普通攻击时：少花费1个岩元素。（每回合1次）
 * 角色普通攻击造成的伤害+2，造成的物理伤害变为岩元素伤害。
 * 持续回合：2
 */
const SweepingTimeStatus = createStatus(116022)
  .withDuration(2)
  .withThis({ deduct: true })
  .on("beforeUseDice",
    (c) => !!c.useSkillCtx && c.useSkillCtx.info.type === "normal",
    (c) => {
      c.deductCost(DiceType.Geo);
      c.this.deduct = false;
    })
  .on("actionPhase", (c) => { c.this.deduct = true; })
  .on("earlyBeforeDealDamage", (c) => {
    if (c.damageType === DamageType.Physical) {
      c.changeDamageType(DamageType.Geo);
    }
  })
  .on("beforeSkillDamage",
    (c) => c.sourceSkill.info.type === "normal",
    (c) => { c.addDamage(2); })
  .build();

/**
 * **大扫除**
 * 造成4点岩元素伤害，本角色附属大扫除。
 */
const SweepingTime = createSkill(16023)
  .setType("burst")
  .costGeo(4)
  .costEnergy(2)
  .dealDamage(4, DamageType.Geo)
  .createCharacterStatus(SweepingTimeStatus)
  .build();

export const Noelle = createCharacter(1602)
  .addTags("geo", "claymore", "mondstadt")
  .maxEnergy(2)
  .addSkills(FavoniusBladeworkMaid, Breastplate, SweepingTime)
  .build();

/**
 * **支援就交给我吧**
 * 战斗行动：我方出战角色为诺艾尔时，装备此牌。
 * 诺艾尔装备此牌后，立刻使用一次护心铠。
 * 诺艾尔普通攻击后：如果此牌和护体岩铠仍在场，则治疗我方所有角色1点。（每回合1次）
 * 【注：3.7 之前的描述】
 * 装备有此牌的诺艾尔生成的护体岩铠，会在诺艾尔使用普通攻击后，治疗我方所有角色1点。（每回合1次）
 * （牌组中包含诺艾尔，才能加入牌组）
 */
export const IGotYourBack = createCard(216021, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(Noelle)
  .addCharacterFilter(Noelle)
  .costGeo(3)
  .buildToEquipment()
  .on("enter", (c) => { c.useSkill(Breastplate); })
  .withUsagePerRound(1)
  .on("useSkill",
    (c) => c.info.type === "normal" && !!c.findCombatStatus(FullPlate),
    (c) => {
      c.queryCharacterAll("*").forEach((ch) => ch.heal(1));
    })
  .build();
