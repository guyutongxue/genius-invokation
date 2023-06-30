import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **神代射术**
 * 造成2点物理伤害。
 */
const DivineMarksmanship = createSkill(15031)
  .setType("normal")
  .costAnemo(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **高天之歌**
 * 造成2点风元素伤害，生成风域。
 */
const SkywardSonnet = createSkill(15032)
  .setType("elemental")
  .costAnemo(3)
  // TODO
  .build();

/**
 * **风神之诗**
 * 造成2点风元素伤害，召唤暴风之眼。
 */
const WindsGrandOde = createSkill(15033)
  .setType("burst")
  .costAnemo(3)
  .costEnergy(2)
  // TODO
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
  .costAnemo(3)
  // TODO
  .build();
