import { character, skill, summon, card, DamageType, SkillHandle } from "@gi-tcg/core/builder";

/**
 * @id 115012
 * @name 大型风灵
 * @description
 * 结束阶段：造成2点风元素伤害。
 * 可用次数：3
 * 我方角色或召唤物引发扩散反应后：转换此牌的元素类型，改为造成被扩散的元素类型的伤害。（离场前仅限一次）
 * 此召唤物在场时：如果此牌的元素类型已转换，则使我方造成的此类元素伤害+1。
 */
export const LargeWindSpirit01 = summon(115012)
  .endPhaseDamage("swirledAnemo", 2)
  .usage(3)
  .on("beforeDealDamage", (c) => {
    const color = c.getVariable("hintIcon");
    return color !== DamageType.Anemo && color === c.damageInfo.type;
  })
  .increaseDamage(1)
  .done();

/**
 * @id 115011
 * @name 大型风灵
 * @description
 * 结束阶段：造成2点风元素伤害。
 * 可用次数：3
 * 我方角色或召唤物引发扩散反应后：转换此牌的元素类型，改为造成被扩散的元素类型的伤害。（离场前仅限一次）
 */
export const LargeWindSpirit = summon(115011)
  .endPhaseDamage("swirledAnemo", 2)
  .usage(3)
  .done();

/**
 * @id 15011
 * @name 简式风灵作成
 * @description
 * 造成1点风元素伤害。
 */
export const WindSpiritCreation = skill(15011)
  .type("normal")
  .costAnemo(1)
  .costVoid(2)
  .damage(DamageType.Anemo, 1)
  .done();

/**
 * @id 15012
 * @name 风灵作成·陆叁零捌
 * @description
 * 造成3点风元素伤害，使对方强制切换到前一个角色。
 */
export const AstableAnemohypostasisCreation6308 = skill(15012)
  .type("elemental")
  .costAnemo(3)
  .damage(DamageType.Anemo, 3)
  .switchActive("opp prev")
  .done();

/**
 * @id 15013
 * @name 禁·风灵作成·柒伍同构贰型
 * @description
 * 造成1点风元素伤害，召唤大型风灵。
 */
export const ForbiddenCreationIsomer75TypeIi: SkillHandle = skill(15013)
  .type("burst")
  .costAnemo(3)
  .costEnergy(2)
  .damage(DamageType.Anemo, 1)
  .if((c) => c.self.hasEquipment(ChaoticEntropy))
  .summon(LargeWindSpirit01)
  .else()
  .summon(LargeWindSpirit)
  .done();

/**
 * @id 1501
 * @name 砂糖
 * @description
 * 「没有实战过的牌组不值得判断强度！」
 */
export const Sucrose = character(1501)
  .tags("anemo", "catalyst", "mondstadt")
  .health(10)
  .energy(2)
  .skills(WindSpiritCreation, AstableAnemohypostasisCreation6308, ForbiddenCreationIsomer75TypeIi)
  .done();

/**
 * @id 215011
 * @name 混元熵增论
 * @description
 * 战斗行动：我方出战角色为砂糖时，装备此牌。
 * 砂糖装备此牌后，立刻使用一次禁·风灵作成·柒伍同构贰型。
 * 装备有此牌的砂糖生成的大型风灵已转换成另一种元素后：我方造成的此类元素伤害+1。
 * （牌组中包含砂糖，才能加入牌组）
 */
export const ChaoticEntropy = card(215011)
  .costAnemo(3)
  .costEnergy(2)
  .talent(Sucrose)
  .on("enter")
  .useSkill(ForbiddenCreationIsomer75TypeIi)
  .done();
