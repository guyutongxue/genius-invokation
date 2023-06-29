import { createCard, createCharacter, createSkill, createSummon, DamageType, Target } from "@gi-tcg";

/**
 * **一文字**
 * 造成2点物理伤害。
 */
const Ichimonji = createSkill(25011)
  .setType("normal")
  .costAnemo(1)
  .costVoid(2)
  .dealDamage(2, DamageType.Physical)
  .build();

/**
 * **剑影·孤风**
 * 结束阶段：造成1点风元素伤害。
 * 可用次数：2
 */
const shadowswordLoneGale = createSummon(125011)
  .withUsage(2)
  .on("endPhase", (c) =>  c.dealDamage(1, DamageType.Anemo))
  .build();

/**
 * **孤风刀势**
 * 召唤剑影·孤风。
 */
const BlusteringBlade = createSkill(25012)
  .setType("elemental")
  .costAnemo(3)
  .summon(shadowswordLoneGale)
  .build();

/**
 * **剑影·霜驰**
 * 结束阶段：造成1点冰元素伤害。
 * 可用次数：2
 */
const shadowswordGallopingFrost = createSummon(125012)
  .withUsage(2)
  .on("endPhase", (c) =>  c.dealDamage(1, DamageType.Cryo))
  .build();

/**
 * **霜驰影突**
 * 召唤剑影·霜驰。
 */
const FrostyAssault = createSkill(25013)
  .setType("elemental")
  .costCryo(3)
  .summon(shadowswordGallopingFrost)
  .build();

/**
 * **机巧伪天狗抄**
 * 造成4点风元素伤害，触发所有我方剑影召唤物的效果。（不消耗其可用次数）
 */
const PseudoTenguSweeper = createSkill(25014)
  .setType("burst")
  .costAnemo(3)
  .costEnergy(3)
  .do((c) => {
    const a = c.hasSummon(shadowswordLoneGale);
    if (a) { a.emitEndPhaseEffect(false); }
    const b = c.hasSummon(shadowswordGallopingFrost);
    if (b) { b.emitEndPhaseEffect(false); }
  })
  .build();

export const MaguuKenki = createCharacter(2501)
  .addTags("anemo", "monster")
  .addSkills(Ichimonji, BlusteringBlade, FrostyAssault, PseudoTenguSweeper)
  .build();

/**
 * **机巧神通**
 * 战斗行动：我方出战角色为魔偶剑鬼时，装备此牌。
 * 魔偶剑鬼装备此牌后，立刻使用一次孤风刀势。
 * 装备有此牌的魔偶剑鬼施放孤风刀势后，我方切换到后一个角色；施放霜驰影突后，我方切换到前一个角色。
 * （牌组中包含魔偶剑鬼，才能加入牌组）
 */
export const TranscendentAutomaton = createCard(225011)
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(MaguuKenki)
  .addActiveCharacterFilter(MaguuKenki)
  .costAnemo(3)
  .useSkill(BlusteringBlade)
  .buildToEquipment()
  .on("useSkill", (c) => {
    if (c.info.id === BlusteringBlade) {
      c.switchActive(Target.myNext())
    } else if (c.info.id === FrostyAssault) {
      c.switchActive(Target.myPrev())
    }
  })
  .build();
