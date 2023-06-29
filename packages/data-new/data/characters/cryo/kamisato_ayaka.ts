import { createCard, createCharacter, createSkill, createSummon, DamageType, DiceType } from "@gi-tcg";
import { CryoElementalInfusion, CryoElementalInfusion01 } from "../../status/infusions";

/**
 * **神里流·倾**
 * 造成2点物理伤害。
 */
const KamisatoArtKabuki = createSkill(11051)
  .setType("normal")
  .costCryo(1)
  .costVoid(2)
  .dealDamage(2, DamageType.Physical)
  .build();

/**
 * **神里流·冰华**
 * 造成3点冰元素伤害。
 */
const KamisatoArtHyouka = createSkill(11052)
  .setType("elemental")
  .costCryo(3)
  .dealDamage(3, DamageType.Cryo)
  .build();

/**
 * **霜见雪关扉**
 * 结束阶段：造成2点冰元素伤害。
 * 可用次数：2
 */
const FrostflakeSekiNoTo = createSummon(111051)
  .withUsage(2)
  .on("endPhase", (c) => { c.dealDamage(2, DamageType.Cryo); })
  .build();

/**
 * **神里流·霜灭**
 * 造成4点冰元素伤害，召唤霜见雪关扉。
 */
const KamisatoArtSoumetsu = createSkill(11053)
  .setType("burst")
  .costCryo(3)
  .costEnergy(3)
  .dealDamage(4, DamageType.Cryo)
  .summon(FrostflakeSekiNoTo)
  .build();

/**
 * **神里流·霰步**
 * 【被动】此角色被切换为「出战角色」时，附属冰元素附魔。
 */
const KamisatoArtSenho = createSkill(11054)
  .setType("passive")
  .on("switchActive", (c) => {
    if (c.to.entityId === KamisatoAyaka) {
      if (c.to.hasEquipment(KantenSenmyouBlessing)) {
        c.to.createStatus(CryoElementalInfusion01);
      } else {
        c.to.createStatus(CryoElementalInfusion);
      }
    }
  })
  .build();

export const KamisatoAyaka = createCharacter(1105)
  .addTags("cryo", "sword", "inazuma")
  .addSkills(KamisatoArtKabuki, KamisatoArtHyouka, KamisatoArtSoumetsu, KamisatoArtSenho)
  .build();

/**
 * **寒天宣命祝词**
 * 装备有此牌的神里绫华生成的冰元素附魔会使所附属角色造成的冰元素伤害+1。
 * 切换到装备有此牌的神里绫华时：少花费1个元素骰。（每回合1次）
 * （牌组中包含神里绫华，才能加入牌组）
 */
export const KantenSenmyouBlessing = createCard(211051)
  .setType("equipment")
  .addTags("talent")
  .requireCharacter(KamisatoAyaka)
  .costCryo(2)
  // TODO
  .buildToEquipment()
  .withUsagePerRound(1)
  .on("beforeUseDice", (c) => {
    if (c.switchActiveCtx?.to.entityId === KamisatoAyaka) {
      c.deductCost(DiceType.Omni);
    } else {
      return false;
    }
  })
  .build();
