import { createCard, createCharacter, createSkill, createSummon, DamageType, Target } from "@gi-tcg";

/**
 * **西风剑术**
 * 造成2点物理伤害。
 */
const FavoniusBladework = createSkill(15021)
  .setType("normal")
  .costAnemo(1)
  .costVoid(2)
  .dealDamage(2, DamageType.Physical)
  .build();

/**
 * **风压剑**
 * 造成3点风元素伤害，使对方强制切换到下一个角色。
 */
const GaleBlade = createSkill(15022)
  .setType("elemental")
  .costAnemo(3)
  .dealDamage(3, DamageType.Anemo)
  .switchActive(Target.oppNext())
  .build();

/**
 * **蒲公英领域**
 * 结束阶段：造成2点风元素伤害，治疗我方出战角色1点。
 * 可用次数：2
 */
const DandelionField = createSummon(115021)
  .withUsage(2)
  .on("endPhase", (c) => {
    const jean = c.hasCharacter(Jean);
    if (jean && jean.hasEquipment(LandsOfDandelion)) {
      c.dealDamage(3, DamageType.Anemo)
    } else {
      c.dealDamage(2, DamageType.Anemo)
    }
    c.heal(1/* , Target.myActive() */)
  })
  .build();

/**
 * **蒲公英之风**
 * 治疗所有我方角色2点，召唤蒲公英领域。
 */
const DandelionBreeze = createSkill(15023)
  .setType("burst")
  .costAnemo(4)
  .costEnergy(3)
  .heal(2, Target.myAll())
  .summon(DandelionField)
  .build();

export const Jean = createCharacter(1502)
  .addTags("anemo", "sword", "mondstadt")
  .addSkills(FavoniusBladework, GaleBlade, DandelionBreeze)
  .build();

/**
 * **蒲公英的国土**
 * 战斗行动：我方出战角色为琴时，装备此牌。
 * 琴装备此牌后，立刻使用一次蒲公英之风。
 * 装备有此牌的琴在场时，蒲公英领域会使我方造成的风元素伤害+1。
 * （牌组中包含琴，才能加入牌组）
 */
export const LandsOfDandelion = createCard(215021)
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(Jean)
  .addActiveCharacterFilter(Jean)
  .costAnemo(4)
  .costEnergy(3)
  .useSkill(DandelionBreeze)
  .buildToEquipment()
  .build();
