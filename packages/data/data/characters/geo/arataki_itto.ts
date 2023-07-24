import { createCard, createCharacter, createSkill, createStatus, createSummon, DamageType, DiceType } from "@gi-tcg";

/**
 * **喧哗屋传说**
 * 造成2点物理伤害。
 */
const FightClubLegend = createSkill(16051)
  .setType("normal")
  .costGeo(1)
  .costVoid(2)
  .dealDamage(2, DamageType.Physical)
  .build();

/**
 * **阿丑**
 * 我方出战角色受到伤害时：抵消1点伤害。
 * 可用次数：1，耗尽时不弃置此牌。
 * 此召唤物在场期间可触发1次：我方角色受到伤害后，为荒泷一斗附属乱神之怪力。
 * 结束阶段：弃置此牌，造成1点岩元素伤害。
 */
const Ushi = createSummon(116051)
  .withUsage(1)
  .noDispose()
  .withThis({ addStatus: true })
  .on("beforeDamaged",
    (c) => c.target.isActive(),
    (c) => c.decreaseDamage(1))
  .on("damaged", (c) => {
    const itto = c.queryCharacter(`@${AratakiItto}`);
    if (c.this.addStatus && itto) {
      itto.createStatus(SuperlativeSuperstrength);
      c.this.addStatus = false;
    }
  })
  .on("endPhase", (c) => {
    c.dealDamage(1, DamageType.Geo);
    c.this.dispose();
  })
  .build()

/**
 * **乱神之怪力**
 * 所附属角色进行重击时：造成的伤害+1。如果可用次数至少为2，则少花费1个无色元素。
 * 可用次数：1（可叠加，最多叠加到3次）
 */
const SuperlativeSuperstrength = createStatus(116054)
  .withUsage(1, 3)
  .on("beforeUseDice",
    (c) => !!(c.useSkillCtx?.charged && c.this.value > 2),
    (c) => c.deductCost(DiceType.Void))
  .on("beforeSkillDamage",
    (c) => c.sourceSkill.charged,
    (c) => c.addDamage(1))
  .build()

/**
 * **魔杀绝技·赤牛发破！**
 * 造成1点岩元素伤害，召唤阿丑，本角色附属乱神之怪力。
 */
const MasatsuZetsugiAkaushiBurst = createSkill(16052)
  .setType("elemental")
  .costGeo(3)
  .dealDamage(1, DamageType.Geo)
  .summon(Ushi)
  .createCharacterStatus(SuperlativeSuperstrength)
  .build();

/**
 * **怒目鬼王**
 * 所附属角色普通攻击造成的伤害+2，造成的物理伤害变为岩元素伤害。
 * 持续回合：2
 * 所附属角色普通攻击后：为其附属乱神之怪力。（每回合1次）
 */
const RagingOniKing = createStatus(116053)
  .withDuration(2)
  .withThis({ addStatus: true })
  .on("earlyBeforeDealDamage", (c) => {
    if (c.sourceSkill?.info.type === "normal") {
      c.addDamage(2);
    }
    if (c.damageType === DamageType.Physical) {
      c.changeDamageType(DamageType.Geo);
    }
  })
  .on("useSkill", (c) => {
    if (c.this.addStatus && c.info.type === "normal") {
      c.this.master!.createStatus(SuperlativeSuperstrength);
      c.this.addStatus = false;
    }
  })
  .on("actionPhase", (c) => {
    c.this.addStatus = true;
  })
  .build();

/**
 * **最恶鬼王·一斗轰临！！**
 * 造成5点岩元素伤害，本角色附属怒目鬼王。
 */
const RoyalDescentBeholdIttoTheEvil = createSkill(16053)
  .setType("burst")
  .costGeo(3)
  .costEnergy(3)
  .dealDamage(5, DamageType.Geo)
  .createCharacterStatus(RagingOniKing)
  .build();

export const AratakiItto = createCharacter(1605)
  .addTags("geo", "claymore", "inazuma")
  .addSkills(FightClubLegend, MasatsuZetsugiAkaushiBurst, RoyalDescentBeholdIttoTheEvil)
  .build();

/**
 * **荒泷第一**
 * 战斗行动：我方出战角色为荒泷一斗时，装备此牌。
 * 荒泷一斗装备此牌后，立刻使用一次喧哗屋传说。
 * 装备有此牌的荒泷一斗每回合第2次及以后使用喧哗屋传说时：如果触发乱神之怪力，伤害额外+1。
 * （牌组中包含荒泷一斗，才能加入牌组）
 */
export const AratakiIchiban = createCard(216051, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(AratakiItto)
  .addCharacterFilter(AratakiItto)
  .costGeo(1)
  .costVoid(2)
  .useSkill(FightClubLegend)
  .buildToEquipment()
  .withThis({ attackCount: 0 })
  .on("beforeSkillDamage", (c) => {
    if (c.this.attackCount >= 1) {
      if (c.this.master.findStatus(SuperlativeSuperstrength) && c.sourceSkill.charged) {
        c.addDamage(1);
      }
    }
    c.this.attackCount++;
  })
  .build();
