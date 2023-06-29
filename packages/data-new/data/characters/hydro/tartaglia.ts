import { createCard, createCharacter, createSkill, createStatus, DamageType, Target } from "@gi-tcg";

/**
 * **断雨**
 * 造成2点物理伤害。
 */
const CuttingTorrent = createSkill(12041)
  .setType("normal")
  .costHydro(1)
  .costVoid(2)
  .dealDamage(2, DamageType.Physical)
  .build();

/**
 * **远程状态**
 * 所附属角色进行重击后：目标角色附属断流。
 */
const RangedStance = createStatus(112041)
  .on("useSkill", (c) => {
    if (c.isCharged() && c.damage) {
      c.createStatus(Riptide, c.damage.target.asTarget());
    }
  })
  .build();

/**
 * **近战状态**
 * 角色造成的物理伤害转换为水元素伤害。
 * 角色进行重击后：目标角色附属断流。
 * 角色对附属有断流的角色造成的伤害+1；
 * 角色对已附属有断流的角色使用技能后：对下一个敌方后台角色造成1点穿透伤害。（每回合至多2次）
 * 持续回合：2
 */
const MeleeStance = createStatus(112042)
  .withDuration(2)
  .do({
    onBeforeDealDamage(c) {
      c.changeDamageType(DamageType.Hydro);
    },
    onUseSkill(c) {
      if (c.isCharged() && c.damage) {
        c.createStatus(Riptide, c.damage.target.asTarget());
      }
      if (this.piercingCount && c.damage && c.damage.target.hasStatus(Riptide)) {
        c.dealDamage(1, DamageType.Piercing, Target.oppNext());
        this.piercingCount--;
      }
    },
    onActionPhase() {
      this.piercingCount = 2;
    }
  }, { piercingCount: 2 })
  .build();


/**
 * **魔王武装·狂澜**
 * 切换为近战状态，然后造成2点水元素伤害。
 */
const FoulLegacyRagingTide = createSkill(12042)
  .setType("elemental")
  .costHydro(3)
  .removeStatus(RangedStance)
  .createStatus(MeleeStance)
  .dealDamage(2, DamageType.Hydro)
  .build();

/**
 * **极恶技·尽灭闪**
 * 依据达达利亚当前所处的状态，进行不同的攻击：
 * 远程状态·魔弹一闪：造成4点水元素伤害，返还2点充能，目标角色附属断流。
 * 近战状态·尽灭水光：造成7点水元素伤害。
 */
const HavocObliteration = createSkill(12043)
  .setType("burst")
  .costHydro(3)
  .costEnergy(3)
  .do((c) => {
    if (c.character.hasStatus(RangedStance)) {
      c.dealDamage(4, DamageType.Hydro);
      c.gainEnergy(2);
      c.createStatus(Riptide, Target.oppActive());
    } else if (c.character.hasStatus(MeleeStance)) {
      c.dealDamage(7, DamageType.Hydro);
    }
  })
  .build();

/**
 * **遏浪**
 * 【被动】战斗开始时，初始附属远程状态。
 * 角色所附属的近战状态效果结束时，重新附属远程状态。
 */
const TideWithholder = createSkill(12044)
  .setType("passive")
  .on("battleBegin", (c) => { c.createStatus(RangedStance) })
  .build();

export const Tartaglia = createCharacter(1204)
  .addTags("hydro", "bow", "fatui")
  .addSkills(CuttingTorrent, FoulLegacyRagingTide, HavocObliteration, TideWithholder)
  .build();

/**
 * **断流**
 * 所附属角色被击倒后：对所在阵营的出战角色附属「断流」。
 * （处于「近战状态」的达达利亚攻击所附属角色时，会造成额外伤害。）
 * 持续回合：2
 */
const Riptide = createStatus(112043)
  .withDuration(2)
  .on("defeated", (c) => {
    c.createStatus(Riptide, Target.oppActive());
  })
  .build();

/**
 * **深渊之灾·凝水盛放**
 * 战斗行动：我方出战角色为达达利亚时，装备此牌。
 * 达达利亚装备此牌后，立刻使用一次魔王武装·狂澜。
 * 结束阶段：对所有附属有断流的敌方角色造成1点穿透伤害。
 * （牌组中包含达达利亚，才能加入牌组）
 */
export const AbyssalMayhemHydrospout = createCard(212041)
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(Tartaglia)
  .addActiveCharacterFilter(Tartaglia)
  .costHydro(4)
  .useSkill(FoulLegacyRagingTide)
  .buildToEquipment()
  .on("endPhase", (c) => {
    c.allCharacters(true)
      .filter(c => c.hasStatus(Riptide))
      .forEach((ch) => {
        c.dealDamage(1, DamageType.Piercing, ch.asTarget());
      });
  })
  .build();
