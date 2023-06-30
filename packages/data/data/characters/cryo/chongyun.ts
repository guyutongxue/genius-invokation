import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **灭邪四式**
 * 造成2点物理伤害。
 */
const Demonbane = createSkill(11041)
  .setType("normal")
  .costCryo(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **重华叠霜**
 * 造成3点冰元素伤害，生成重华叠霜领域。
 */
const ChonghuasLayeredFrost = createSkill(11042)
  .setType("elemental")
  .costCryo(3)
  // TODO
  .build();

/**
 * **云开星落**
 * 造成7点冰元素伤害。
 */
const CloudpartingStar = createSkill(11043)
  .setType("burst")
  .costCryo(3)
  .costEnergy(3)
  // TODO
  .build();

export const Chongyun = createCharacter(1104)
  .addTags("cryo", "claymore", "liyue")
  .addSkills(Demonbane, ChonghuasLayeredFrost, CloudpartingStar)
  .build();

/**
 * **吐纳真定**
 * 战斗行动：我方出战角色为重云时，装备此牌。
 * 重云装备此牌后，立刻使用一次重华叠霜。
 * 装备有此牌的重云生成的重华叠霜领域获得以下效果：
 * 初始持续回合+1，并且使我方单手剑、双手剑或长柄武器角色的普通攻击伤害+1。
 * （牌组中包含重云，才能加入牌组）
 */
export const SteadyBreathing = createCard(211041, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .costCryo(4)
  // TODO
  .build();
