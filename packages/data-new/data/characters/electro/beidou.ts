import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **征涛**
 * 造成2点物理伤害。
 */
const Oceanborne = createSkill(14051)
  .setType("normal")
  .costElectro(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **捉浪**
 * 本角色附属捉浪·涛拥之守并准备技能：踏潮。
 */
const Tidecaller = createSkill(14052)
  .setType("elemental")
  .costElectro(3)
  // TODO
  .build();

/**
 * **斫雷**
 * 造成3点雷元素伤害，生成雷兽之盾。
 */
const Stormbreaker = createSkill(14053)
  .setType("burst")
  .costElectro(4)
  .costEnergy(3)
  // TODO
  .build();

/**
 * **踏潮**
 * （需准备1个行动轮）
 * 造成2点雷元素伤害。
 */
const Wavestrider = createSkill(14054)
  .setType("elemental")
  // TODO
  .build();

export const Beidou = createCharacter(1405)
  .addTags("electro", "claymore", "liyue")
  .addSkills(Oceanborne, Tidecaller, Stormbreaker, Wavestrider)
  .build();

/**
 * **霹雳连霄**
 * 战斗行动：我方出战角色为北斗时，装备此牌。
 * 北斗装备此牌后，立刻使用一次捉浪。
 * 装备有此牌的北斗使用踏潮时：如果准备技能期间受到过伤害，则使北斗本回合内「普通攻击」少花费1个无色元素。（最多触发2次）
 * （牌组中包含北斗，才能加入牌组）
 */
export const LightningStorm = createCard(214051)
  .setType("equipment")
  .addTags("talent", "action")
  .costElectro(3)
  // TODO
  .build();
