import { createCard, createCharacter, createSkill, createStatus, DamageType } from "@gi-tcg";

/**
 * **灭邪四式**
 * 造成2点物理伤害。
 */
const Demonbane = createSkill(11041)
  .setType("normal")
  .costCryo(1)
  .costVoid(2)
  .dealDamage(2, DamageType.Physical)
  .build();

/**
 * **重华叠霜领域**
 * 我方单手剑、双手剑或长柄武器角色造成的物理伤害变为冰元素伤害。
 * 持续回合：2
 */
const ChonghuaFrostField = createStatus(111041)
  .withDuration(2)
  .on("enter", (c) => { c.findCombatStatus(ChonghuaFrostField01)?.dispose(); })
  .on("earlyBeforeDealDamage",
    (c) => !!c.sourceSkill,
    (c) => {
      const { character: { info } } = c.sourceSkill!;
      const chCond = info.tags.includes("sword")
        || info.tags.includes("claymore")
        || info.tags.includes("pole");
      if (chCond && c.damageType === DamageType.Physical) {
        c.changeDamageType(DamageType.Cryo);
      }
    })
  .build();

/**
 * **重华叠霜领域**
 * 我方单手剑、双手剑或长柄武器角色造成的物理伤害变为冰元素伤害，普通攻击造成的伤害+1。
 * 持续回合：3
 */
const ChonghuaFrostField01 = createStatus(111042)
  .withDuration(2)
  .on("enter", (c) => { c.findCombatStatus(ChonghuaFrostField)?.dispose(); })
  .on("earlyBeforeDealDamage",
    (c) => !!c.sourceSkill,
    (c) => {
      const { info: skillInfo, character: { info } } = c.sourceSkill!;
      const chCond = info.tags.includes("sword")
        || info.tags.includes("claymore")
        || info.tags.includes("pole");
      if (chCond && c.damageType === DamageType.Physical) {
        c.changeDamageType(DamageType.Cryo);
      }
      if (skillInfo.type === "normal") {
        c.addDamage(1);
      }
    })
  .build();

/**
 * **重华叠霜**
 * 造成3点冰元素伤害，生成重华叠霜领域。
 */
const ChonghuasLayeredFrost = createSkill(11042)
  .setType("elemental")
  .costCryo(3)
  .dealDamage(3, DamageType.Cryo)
  .do((c) => {
    if (c.character.findEquipment(SteadyBreathing)) {
      c.character.createStatus(ChonghuaFrostField01);
    } else {
      c.character.createStatus(ChonghuaFrostField);
    }
  })
  .build();

/**
 * **云开星落**
 * 造成7点冰元素伤害。
 */
const CloudpartingStar = createSkill(11043)
  .setType("burst")
  .costCryo(3)
  .costEnergy(3)
  .dealDamage(7, DamageType.Cryo)
  .build();

export const Chongyun = createCharacter(1104)
  .addTags("cryo", "claymore", "liyue")
  .addSkills(Demonbane, ChonghuasLayeredFrost, CloudpartingStar)
  .build();

/**
 * **吐纳真定**
 * 战斗行动：我方出战角色为重云时，装备此牌。
 * 重云装备此牌后，立刻使用一次重华叠霜。
 * 装备有此牌的重云生成的重华叠霜领域获得以下效果：
 * 初始持续回合+1，并且使我方单手剑、双手剑或长柄武器角色的普通攻击伤害+1。
 * （牌组中包含重云，才能加入牌组）
 */
export const SteadyBreathing = createCard(211041, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(Chongyun)
  .addCharacterFilter(Chongyun)
  .costCryo(4)
  .buildToEquipment()
  .on("enter", (c) => { c.useSkill(ChonghuasLayeredFrost); })
  .build();
