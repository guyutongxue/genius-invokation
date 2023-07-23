import { createCard, createCharacter, createSkill, createStatus, DamageType, Target } from "@gi-tcg";

/**
 * **断雨**
 * 造成2点物理伤害。
 */
const CuttingTorrent = createSkill(12041)
  .setType("normal")
  .costHydro(1)
  .costVoid(2)
  .do((c) => {
    c.dealDamage(2, DamageType.Physical);
    if (c.isCharged()) {
      c.createStatus(Riptide, c.target.asTarget());
    }
  })
  .dealDamage(2, DamageType.Physical)
  .build();

// 注：“重击对目标角色附属断流”这一效果的触发，移到了普通攻击的描述里。
// 原因：当重击击倒对方角色后，可观察到断流先被附属，随后再触发断流的“角色倒下”效果
// 规则书说：倒下的结算是在（导致角色生命值为 0 的）技能或效果结算完毕后触发
// 这里是普通攻击技能触发倒下，所以结算时间点是在普通攻击结束后；而不是在状态生效的时刻。

/**
 * **远程状态**
 * 所附属角色进行重击后：目标角色附属断流。
 */
const RangedStance = createStatus(112041)
  // .on("useSkill", (c) => {
  //   if (c.isCharged()) {
  //     c.createStatus(Riptide, c.target.asTarget());
  //   }
  // })
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
    onEarlyBeforeDealDamage(c) {
      c.changeDamageType(DamageType.Hydro);
    },
    onBeforeDealDamage(c) {
      if (c.target.findStatus(Riptide)) {
        c.addDamage(1);
      }
    },
    onUseSkill(c) {
      // if (c.isCharged() && c) {
      //   c.createStatus(Riptide, c.target.asTarget());
      // }
      if (this.piercingCount && c.target.hasStatus(Riptide)) {
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
  .on("revive", (c) => { c.createStatus(RangedStance) })
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
export const AbyssalMayhemHydrospout = createCard(212041, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(Tartaglia)
  .addCharacterFilter(Tartaglia)
  .costHydro(4)
  .useSkill(FoulLegacyRagingTide)
  .buildToEquipment()
  .on("endPhase", (c) => {
    c.queryCharacterAll("!*")
      .filter(c => c.findStatus(Riptide))
      .forEach((ch) => {
        c.dealDamage(1, DamageType.Piercing, ch.asTarget());
      });
  })
  .build();
