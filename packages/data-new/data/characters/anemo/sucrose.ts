import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **简式风灵作成**
 * 造成1点风元素伤害。
 */
const WindSpiritCreation = createSkill(15011)
  .setType("normal")
  .costAnemo(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **风灵作成·陆叁零捌**
 * 造成3点风元素伤害，使对方强制切换到前一个角色。
 */
const AstableAnemohypostasisCreation6308 = createSkill(15012)
  .setType("elemental")
  .costAnemo(3)
  // TODO
  .build();

/**
 * **禁·风灵作成·柒伍同构贰型**
 * 造成1点风元素伤害，召唤大型风灵。
 */
const ForbiddenCreationIsomer75TypeIi = createSkill(15013)
  .setType("burst")
  .costAnemo(3)
  .costEnergy(2)
  // TODO
  .build();

export const Sucrose = createCharacter(1501)
  .addTags("anemo", "catalyst", "mondstadt")
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
  .costAnemo(3)
  .costEnergy(2)
  // TODO
  .build();
