import { createCard, createCharacter, createSkill, createSummon, DamageType } from "@gi-tcg";

/**
 * **简式风灵作成**
 * 造成1点风元素伤害。
 */
const WindSpiritCreation = createSkill(15011)
  .setType("normal")
  .costAnemo(1)
  .costVoid(2)
  .dealDamage(1, DamageType.Anemo)
  .build();

/**
 * **风灵作成·陆叁零捌**
 * 造成3点风元素伤害，使对方强制切换到前一个角色。
 */
const AstableAnemohypostasisCreation6308 = createSkill(15012)
  .setType("elemental")
  .costAnemo(3)
  .dealDamage(3, DamageType.Anemo)
  .switchActive("!<")
  .build();

/**
 * **大型风灵**
 * 结束阶段：造成2点风元素伤害。
 * 可用次数：3
 * 我方角色或召唤物引发扩散反应后：转换此牌的元素类型，改为造成被扩散的元素类型的伤害。（离场前仅限一次）
 */
const LargeWindSpirit = createSummon(115011)
  .withUsage(3)
  .withThis({ type: DamageType.Anemo })
  .on("enter", (c) => {
    c.findSummon(LargeWindSpirit01)?.dispose();
    return false;
  })
  .on("endPhase", (c) => {
    c.dealDamage(2, c.this.type);
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
 * **大型风灵**
 * 结束阶段：造成2点风元素伤害。
 * 可用次数：3
 * 我方角色或召唤物引发扩散反应后：转换此牌的元素类型，改为造成被扩散的元素类型的伤害。（离场前仅限一次）
 * 此召唤物在场时：如果此牌的元素类型已转换，则使我方造成的此类元素伤害+1。
 */
const LargeWindSpirit01 = createSummon(115012)
  .withUsage(3)
  .withThis({ type: DamageType.Anemo })
  .on("enter", (c) => {
    c.findSummon(LargeWindSpirit)?.dispose();
    return false;
  })
  .on("endPhase", (c) => {
    c.dealDamage(2, c.this.type);
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
  .on("beforeDealDamage", (c) => {
    if (c.this.type !== DamageType.Anemo && c.damageType === c.this.type) {
      c.addDamage(1);
    }
    return false;
  })
  .build();

/**
 * **禁·风灵作成·柒伍同构贰型**
 * 造成1点风元素伤害，召唤大型风灵。
 */
const ForbiddenCreationIsomer75TypeIi = createSkill(15013)
  .setType("burst")
  .costAnemo(3)
  .costEnergy(2)
  .dealDamage(1, DamageType.Anemo)
  .do((c) => {
    if (c.character.findEquipment(ChaoticEntropy)) {
      c.summon(LargeWindSpirit01);
    } else {
      c.summon(LargeWindSpirit);
    }
  })
  .build();

export const Sucrose = createCharacter(1501)
  .addTags("anemo", "catalyst", "mondstadt")
  .maxEnergy(2)
  .addSkills(WindSpiritCreation, AstableAnemohypostasisCreation6308, ForbiddenCreationIsomer75TypeIi)
  .build();

/**
 * **混元熵增论**
 * 战斗行动：我方出战角色为砂糖时，装备此牌。
 * 砂糖装备此牌后，立刻使用一次禁·风灵作成·柒伍同构贰型。
 * 装备有此牌的砂糖生成的大型风灵已转换成另一种元素后：我方造成的此类元素伤害+1。
 * （牌组中包含砂糖，才能加入牌组）
 */
export const ChaoticEntropy = createCard(215011, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(Sucrose)
  .addCharacterFilter(Sucrose)
  .costAnemo(3)
  .costEnergy(2)
  .buildToEquipment()
  .on("enter", (c) => c.useSkill(ForbiddenCreationIsomer75TypeIi))
  .build();
