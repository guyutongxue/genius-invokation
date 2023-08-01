import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";
import { ElectroInfusion, ElectroInfusion01 } from "../../status/infusions";

/**
 * **云来剑法**
 * 造成2点物理伤害。
 */
const YunlaiSwordsmanship = createSkill(14031)
  .setType("normal")
  .costElectro(1)
  .costVoid(2)
  .dealDamage(2, DamageType.Physical)
  .build();

/**
 * **星斗归位**
 * 造成3点雷元素伤害，生成手牌雷楔。
 */
const StellarRestoration = createSkill(14032)
  .setType("elemental")
  .costElectro(3)
  .dealDamage(3, DamageType.Electro)
  .do((c) => {
    if (c.triggeredByCard(LightningStiletto)) {
      if (c.character.findEquipment(ThunderingPenance)) {
        c.character.createStatus(ElectroInfusion01);
      } else {
        c.character.createStatus(ElectroInfusion);
      }
    } else {
      c.createCards(LightningStiletto);
    }
  })
  .build();

/**
 * **天街巡游**
 * 造成4点雷元素伤害，对所有敌方后台角色造成3点穿透伤害。
 */
const StarwardSword = createSkill(14033)
  .setType("burst")
  .costElectro(4)
  .costEnergy(3)
  .dealDamage(4, DamageType.Electro)
  .dealDamage(3, DamageType.Piercing, "!<>")
  .build();

export const Keqing = createCharacter(1403)
  .addTags("electro", "sword", "liyue")
  .addSkills(YunlaiSwordsmanship, StellarRestoration, StarwardSword)
  .build();

/**
 * **雷楔**
 * 战斗行动：将刻晴切换到场上，立刻使用星斗归位。本次星斗归位会为刻晴附属雷元素附魔，但是不会再生成雷楔。
 * （刻晴使用星斗归位时，如果此牌在手中：不会再生成雷楔，而是改为弃置此牌，并为刻晴附属雷元素附魔）
 */
const LightningStiletto = createCard(114031)
  .addTags("action", "talent")
  .costElectro(3)
  .switchActive(`@${Keqing}`)
  .useSkill(StellarRestoration)
  .build();

/**
 * **抵天雷罚**
 * 战斗行动：我方出战角色为刻晴时，装备此牌。
 * 刻晴装备此牌后，立刻使用一次星斗归位。
 * 装备有此牌的刻晴生成的雷元素附魔获得以下效果：
 * 初始持续回合+1，并且会使所附属角色造成的雷元素伤害+1。
 * （牌组中包含刻晴，才能加入牌组）
 */
export const ThunderingPenance = createCard(214031, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(Keqing)
  .addCharacterFilter(Keqing)
  .costElectro(3)
  .buildToEquipment()
  .on("enter", (c) => { c.useSkill(StellarRestoration) })
  .build();
