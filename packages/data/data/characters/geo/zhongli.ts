import { createCard, createCharacter, createSkill, createStatus, createSummon, DamageType, Target } from "@gi-tcg";

/**
 * **岩雨**
 * 造成2点物理伤害。
 */
const RainOfStone = createSkill(16031)
  .setType("normal")
  .costGeo(1)
  .costVoid(2)
  .dealDamage(2, DamageType.Physical)
  .build();

/**
 * **岩脊**
 * 结束阶段：造成1点岩元素伤害。
 * 可用次数：2
 */
const StoneStele = createSummon(116031)
  .withUsage(2)
  .on("endPhase", (c) => c.dealDamage(1, DamageType.Geo))
  .build();

/**
 * **地心**
 * 造成1点岩元素伤害，召唤岩脊。
 */
const DominusLapidis = createSkill(16032)
  .setType("elemental")
  .costGeo(3)
  .dealDamage(1, DamageType.Geo)
  .summon(StoneStele)
  .build();

/**
 * **玉璋护盾**
 * 为我方出战角色提供2点护盾。
 */
const JadeShield = createStatus(116032)
  .shield(2)
  .build();

/**
 * **地心·磐礴**
 * 造成3点岩元素伤害，召唤岩脊，生成玉璋护盾。
 */
const DominusLapidisStrikingStone = createSkill(16033)
  .setType("elemental")
  .costGeo(5)
  .dealDamage(3, DamageType.Geo)
  .summon(StoneStele)
  .createCombatStatus(JadeShield)
  .build();

/**
 * **石化**
 * 角色无法使用技能。（持续到回合结束）
 */
const Petrification = createStatus(116033)
  .disableSkill()
  .withDuration(1)
  .build();

/**
 * **天星**
 * 造成4点岩元素伤害，目标角色附属石化。
 */
const PlanetBefall = createSkill(16034)
  .setType("burst")
  .costGeo(3)
  .costEnergy(3)
  .dealDamage(4, DamageType.Geo)
  .createStatus(Petrification, Target.oppActive())
  .build();

export const Zhongli = createCharacter(1603)
  .addTags("geo", "pole", "liyue")
  .addSkills(RainOfStone, DominusLapidis, DominusLapidisStrikingStone, PlanetBefall)
  .build();

/**
 * **炊金馔玉**
 * 战斗行动：我方出战角色为钟离时，装备此牌。
 * 钟离装备此牌后，立刻使用一次地心·磐礴。
 * 我方出战角色在护盾角色状态或护盾出战状态的保护下时，我方召唤物造成的岩元素伤害+1。
 * （牌组中包含钟离，才能加入牌组）
 */
export const DominanceOfEarth = createCard(216031, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(Zhongli)
  .addCharacterFilter(Zhongli)
  .costGeo(5)
  .useSkill(DominusLapidisStrikingStone)
  .buildToEquipment()
  .listenToOther()
  .on("beforeDealDamage", (c) => {
    const active = c.hasCharacter(Target.myActive());
    if (c.sourceType === "summon" && active?.hasShield()) {
      c.addDamage(1);
    }
  })
  .build();
