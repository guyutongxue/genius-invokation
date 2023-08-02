import { createCard, createCharacter, createSkill, createStatus, createSummon, DamageType, DiceType } from "@gi-tcg";

/**
 * **神代射术**
 * 造成2点物理伤害。
 */
const DivineMarksmanship = createSkill(15031)
  .setType("normal")
  .costAnemo(1)
  .costVoid(2)
  .dealDamage(2, DamageType.Physical)
  .build();

/**
 * **风域**
 * 我方执行「切换角色」行动时：少花费1个元素骰。
 * 可用次数：2
 */
const StormZone = createStatus(115031)
  .withUsage(2)
  .on("enter", (c) => { c.findCombatStatus(StormZone01)?.dispose(); })
  .on("beforeUseDice", (c) => {
    if (c.switchActiveCtx) {
      c.deductCost(DiceType.Void);
    } else {
      return false;
    }
  })
  .build();

/**
 * **风域**
 * 我方执行「切换角色」行动时：少花费1个元素骰。触发该效果后，使本回合中我方角色下次「普通攻击」少花费1个无色元素。
 * 可用次数：2
 */
const StormZone01 = createStatus(115032)
  .withUsage(2)
  .on("enter", (c) => { c.findCombatStatus(StormZone)?.dispose(); })
  .on("beforeUseDice", (c) => {
    if (c.switchActiveCtx) {
      if (c.deductCost(DiceType.Omni).length > 0) {
        c.createCombatStatus(WindsOfHarmony);
        return true;
      }
    }
    return false;
  })
  .build();

/**
 * **协鸣之风**
 * 本回合中，我方角色下次「普通攻击」少花费1个无色元素。
 */
const WindsOfHarmony = createStatus(115033)
  .withDuration(1)
  .withUsage(1)
  .on("beforeUseDice", (c) => {
    if (c.useSkillCtx?.info.type === "normal") {
      c.deductCost(DiceType.Void);
    }
  })
  .build();

/**
 * **高天之歌**
 * 造成2点风元素伤害，生成风域。
 */
const SkywardSonnet = createSkill(15032)
  .setType("elemental")
  .costAnemo(3)
  .dealDamage(2, DamageType.Anemo)
  .do((c) => {
    if (c.character.findEquipment(EmbraceOfWinds)) {
      c.createCombatStatus(StormZone01);
    } else {
      c.createCombatStatus(StormZone);
    }
  })
  .build();

/**
 * 结束阶段：造成2点风元素伤害，对方切换到距离我方出战角色最近的角色。
 * 可用次数：2
 * 我方角色或召唤物引发扩散反应后：转换此牌的元素类型，改为造成被扩散的元素类型的伤害。（离场前仅限一次）
 */
const Stormeye = createSummon(115034)
  .withUsage(2)
  .withThis({ type: DamageType.Anemo })
  .on("endPhase", (c) => {
    c.dealDamage(2, c.this.type);
    c.switchActive(":recent(|)");
  })
  .on("dealDamage", (c) => {
    if ((c.sourceSkill || c.sourceSummon) && c.this.type === DamageType.Anemo) {
      const newType = c.reaction?.swirledElement() ?? null;
      if (newType !== null) {
        c.this.type = newType;
      }
    }
    return false;
  })
  .build();

/**
 * **风神之诗**
 * 造成2点风元素伤害，召唤暴风之眼。
 */
const WindsGrandOde = createSkill(15033)
  .setType("burst")
  .costAnemo(3)
  .costEnergy(2)
  .dealDamage(2, DamageType.Anemo)
  .summon(Stormeye)
  .build();

export const Venti = createCharacter(1503)
  .addTags("anemo", "bow", "mondstadt")
  .maxEnergy(2)
  .addSkills(DivineMarksmanship, SkywardSonnet, WindsGrandOde)
  .build();

/**
 * **绪风之拥**
 * 战斗行动：我方出战角色为温迪时，装备此牌。
 * 温迪装备此牌后，立刻使用一次高天之歌。
 * 装备有此牌的温迪生成的风域触发后，会使本回合中我方角色下次「普通攻击」少花费1个无色元素。
 * （牌组中包含温迪，才能加入牌组）
 */
export const EmbraceOfWinds = createCard(215031, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(Venti)
  .addCharacterFilter(Venti)
  .costAnemo(3)
  .buildToEquipment()
  .on("enter", (c) => { c.useSkill(SkywardSonnet) })
  .build();
