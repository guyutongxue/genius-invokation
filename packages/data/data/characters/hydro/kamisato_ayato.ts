import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **神里流·转**
 * 造成2点物理伤害。
 */
const KamisatoArtMarobashi = createSkill(12061)
  .setType("normal")
  .costHydro(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **神里流·镜花**
 * 造成2点水元素伤害，本角色附属泷廻鉴花。
 */
const KamisatoArtKyouka = createSkill(12062)
  .setType("elemental")
  .costHydro(3)
  // TODO
  .build();

/**
 * **神里流·水囿**
 * 造成3点水元素伤害，召唤清净之园囿。
 */
const KamisatoArtSuiyuu = createSkill(12063)
  .setType("burst")
  .costHydro(3)
  .costEnergy(3)
  // TODO
  .build();

export const KamisatoAyato = createCharacter(1206)
  .addTags("hydro", "sword", "inazuma")
  .addSkills(KamisatoArtMarobashi, KamisatoArtKyouka, KamisatoArtSuiyuu)
  .build();

/**
 * **镜华风姿**
 * 战斗行动：我方出战角色为神里绫人时，装备此牌。
 * 神里绫人装备此牌后，立刻使用一次神里流·镜花。
 * 装备有此牌的神里绫人触发泷廻鉴花的效果时，对于生命值不多于6的敌人伤害额外+1。
 * （牌组中包含神里绫人，才能加入牌组）
 */
export const KyoukaFuushi = createCard(212061)
  .setType("equipment")
  .addTags("talent", "action")
  .costHydro(3)
  // TODO
  .build();
