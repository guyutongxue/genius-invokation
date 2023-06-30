import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **Plama Lawa**
 * 造成2点物理伤害。
 */
const PlamaLawa = createSkill(26011)
  .setType("normal")
  .costGeo(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **Movo Lawa**
 * 造成3点物理伤害。
 */
const MovoLawa = createSkill(26012)
  .setType("elemental")
  .costGeo(3)
  // TODO
  .build();

/**
 * **Upa Shato**
 * 造成5点物理伤害。
 */
const UpaShato = createSkill(26013)
  .setType("burst")
  .costGeo(3)
  .costEnergy(2)
  // TODO
  .build();

/**
 * **魔化：岩盔**
 * 【被动】战斗开始时，初始附属岩盔和坚岩之力。
 */
const InfusedStonehide = createSkill(26014)
  .setType("passive")
  // TODO
  .build();

export const StonehideLawachurl = createCharacter(2601)
  .addTags("geo", "monster", "hilichurl")
  .maxHealth(8)
  .maxEnergy(2)
  .addSkills(PlamaLawa, MovoLawa, UpaShato, InfusedStonehide)
  .build();

/**
 * **重铸：岩盔**
 * 战斗行动：我方出战角色为丘丘岩盔王时，装备此牌。
 * 丘丘岩盔王装备此牌后，立刻使用一次Upa Shato。
 * 装备有此牌的丘丘岩盔王击倒敌方角色后；丘丘岩盔王重新附属岩盔和坚岩之力。
 * （牌组中包含丘丘岩盔王，才能加入牌组）
 */
export const StonehideReforged = createCard(226011, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .costGeo(4)
  .costEnergy(2)
  // TODO
  .build();
