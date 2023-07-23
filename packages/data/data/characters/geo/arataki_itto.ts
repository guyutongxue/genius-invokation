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
  .do({
    onBeforeDamaged(c) {
      const itto = c.queryCharacter(`@${AratakiItto}`);
      if (this.addStatus && itto) {
        c.createStatus(SuperlativeSuperstrength, itto.asTarget());
        this.addStatus = false;
      }
      if (c.target.isActive()) {
        c.decreaseDamage(1);
      } else {
        return false;
      }
    },
    onEndPhase(c) {
      c.dealDamage(1, DamageType.Geo);
      c.dispose();
    }
  }, { addStatus: true })
  .build()

/**
 * **乱神之怪力**
 * 所附属角色进行重击时：造成的伤害+1。如果可用次数至少为2，则少花费1个无色元素。
 * 可用次数：1（可叠加，最多叠加到3次）
 */
const SuperlativeSuperstrength = createStatus(116054)
  .withUsage(1, 3)
  .on("beforeUseDice", (c) => {
    const usage = c.asStatus().getVisibleValue() ?? 0;
    if (usage >= 2) {
      c.deductCost(DiceType.Void);
    }
    return false;
  })
  .on("beforeSkillDamage", (c) => {
    if (c.isCharged()) {
      c.addDamage(1);
    } else {
      return false;
    }
  })
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
  .createStatus(SuperlativeSuperstrength)
  .build();

/**
 * **怒目鬼王**
 * 所附属角色普通攻击造成的伤害+2，造成的物理伤害变为岩元素伤害。
 * 持续回合：2
 * 所附属角色普通攻击后：为其附属乱神之怪力。（每回合1次）
 */
const RagingOniKing = createStatus(116053)
  .withDuration(2)
  .do({
    onEarlyBeforeDealDamage(c) {
      if (c.sourceSkill?.info.type === "normal" && c.damageType === DamageType.Physical) {
        c.changeDamageType(DamageType.Geo);
        c.addDamage(2);
      }
    },
    onUseSkill(c) {
      if (this.addStatus && c.info.type === "normal") {
        c.createStatus(SuperlativeSuperstrength);
        this.addStatus--;
      }
    },
    onActionPhase() {
      this.addStatus = 1;
    }
  }, { addStatus: 1 })
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
  .createStatus(RagingOniKing)
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
  .do({
    onBeforeSkillDamage(c) {
      if (this.attackCount >= 1) {
        if (c.getMaster().hasStatus(SuperlativeSuperstrength) && c.isCharged()) {
          c.addDamage(1);
        }
      }
      this.attackCount++;
    }
  }, { attackCount: 0 })
  .build();
