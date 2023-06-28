import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **岩雨**
 * 造成2点物理伤害。
 */
const RainOfStone = createSkill(16031)
  .setType("normal")
  .costGeo(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **地心**
 * 造成1点岩元素伤害，召唤岩脊。
 */
const DominusLapidis = createSkill(16032)
  .setType("elemental")
  .costGeo(3)
  // TODO
  .build();

/**
 * **地心·磐礴**
 * 造成3点岩元素伤害，召唤岩脊，生成玉璋护盾。
 */
const DominusLapidisStrikingStone = createSkill(16033)
  .setType("elemental")
  .costGeo(5)
  // TODO
  .build();

/**
 * **天星**
 * 造成4点岩元素伤害，目标角色附属石化。
 */
const PlanetBefall = createSkill(16034)
  .setType("burst")
  .costGeo(3)
  .costEnergy(3)
  // TODO
  .build();

export const Zhongli = createCharacter(1603)
  .addTags("geo", "pole", "liyue")
  .addSkills(RainOfStone, DominusLapidis, DominusLapidisStrikingStone, PlanetBefall)
  .build();

/**
 * **炊金馔玉**
 * 战斗行动：我方出战角色为钟离时，装备此牌。
 * 钟离装备此牌后，立刻使用一次地心·磐礴。
 * 我方出战角色在护盾角色状态或护盾出战状态的保护下时，我方召唤物造成的岩元素伤害+1。
 * （牌组中包含钟离，才能加入牌组）
 */
export const DominanceOfEarth = createCard(216031)
  .setType("equipment")
  .addTags("talent", "action")
  .costGeo(5)
  // TODO
  .build();
