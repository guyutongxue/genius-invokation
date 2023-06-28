import { createCard, createCharacter, createSkill, DamageType } from "@gi-tcg";

/**
 * **行相**
 * 造成1点草元素伤害。
 */
const Akara = createSkill(17031)
  .setType("normal")
  .costDendro(1)
  .costVoid(2)
  // TODO
  .build();

/**
 * **所闻遍计**
 * 造成2点草元素伤害，目标角色附属蕴种印；如果在附属前目标角色已附属有蕴种印，就改为对所有敌方角色附属蕴种印。
 */
const AllSchemesToKnow = createSkill(17032)
  .setType("elemental")
  .costDendro(3)
  // TODO
  .build();

/**
 * **所闻遍计·真如**
 * 造成3点草元素伤害，所有敌方角色附属蕴种印。
 */
const AllSchemesToKnowTathata = createSkill(17033)
  .setType("elemental")
  .costDendro(5)
  // TODO
  .build();

/**
 * **心景幻成**
 * 造成4点草元素伤害，生成摩耶之殿。
 */
const IllusoryHeart = createSkill(17034)
  .setType("burst")
  .costDendro(3)
  .costEnergy(2)
  // TODO
  .build();

export const Nahida = createCharacter(1703)
  .addTags("dendro", "catalyst", "sumeru")
  .addSkills(Akara, AllSchemesToKnow, AllSchemesToKnowTathata, IllusoryHeart)
  .build();

/**
 * **心识蕴藏之种**
 * 战斗行动：我方出战角色为纳西妲时，装备此牌。
 * 纳西妲装备此牌后，立刻使用一次心景幻成。
 * 装备有此牌的纳西妲在场时，根据我方队伍中存在的元素类型提供效果：
 * 火元素：摩耶之殿在场时，自身受到元素反应触发蕴种印的敌方角色，所受蕴种印的穿透伤害改为草元素伤害；
 * 雷元素：摩耶之殿入场时，使当前对方场上蕴种印的可用次数+1；
 * 水元素：装备有此牌的纳西妲所生成的摩耶之殿初始持续回合+1。
 * （牌组中包含纳西妲，才能加入牌组）
 */
export const TheSeedOfStoredKnowledge = createCard(217031, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .costDendro(3)
  .costEnergy(2)
  // TODO
  .build();