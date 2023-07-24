import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **淬炼之剑**
 * 造成2点物理伤害。
 */
const TemperedSword = createSkill(13011)
  .setType("normal")
  .costPyro(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **逆焰之刃**
 * 造成3点火元素伤害。每回合第三次使用本技能时，伤害+2。
 */
const SearingOnslaught = createSkill(13012)
  .setType("elemental")
  .costPyro(3)
  .do((c) => {
    if (c.skillCount(SearingOnslaught) === 3) {
      c.dealDamage(5, DamageType.Pyro);
    } else {
      c.dealDamage(3, DamageType.Pyro);
    }
  })
  .build();

/**
 * **黎明**
 * 造成8点火元素伤害，本角色附属火元素附魔。
 */
const Dawn = createSkill(13013)
  .setType("burst")
  .costPyro(4)
  .costEnergy(3)
  // TODO
  .build();

export const Diluc = createCharacter(1301)
  .addTags("pyro", "claymore", "mondstadt")
  .addSkills(TemperedSword, SearingOnslaught, Dawn)
  .build();

/**
 * **流火焦灼**
 * 战斗行动：我方出战角色为迪卢克时，装备此牌。
 * 迪卢克装备此牌后，立刻使用一次逆焰之刃。
 * 装备有此牌的迪卢克每回合第2次使用逆焰之刃时，少花费1个火元素。
 * （牌组中包含迪卢克，才能加入牌组）
 */
export const FlowingFlame = createCard(213011, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .costPyro(3)
  // TODO
  .build();
