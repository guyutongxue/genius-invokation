import { character, skill, status, combatStatus, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 117031
 * @name 蕴种印
 * @description
 * 任意具有「蕴种印」的所在阵营角色受到元素反应伤害后：对所附属角色造成1点穿透伤害。
 * 可用次数：2
 */
const SeedOfSkandha = status(117031)
  // TODO
  .done();

/**
 * @id 117033
 * @name 摩耶之殿
 * @description
 * 我方引发元素反应时：伤害额外+1。
 * 持续回合：3
 */
const ShrineOfMaya01 = combatStatus(117033)
  // TODO
  .done();

/**
 * @id 117032
 * @name 摩耶之殿
 * @description
 * 我方引发元素反应时：伤害额外+1。
 * 持续回合：2
 */
const ShrineOfMaya = combatStatus(117032)
  // TODO
  .done();

/**
 * @id 17031
 * @name 行相
 * @description
 * 造成1点草元素伤害。
 */
const Akara = skill(17031)
  .type("normal")
  .costDendro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 17032
 * @name 所闻遍计
 * @description
 * 造成2点草元素伤害，目标角色附属蕴种印；如果在附属前目标角色已附属有蕴种印，就改为对所有敌方角色附属蕴种印。
 */
const AllSchemesToKnow = skill(17032)
  .type("elemental")
  .costDendro(3)
  // TODO
  .done();

/**
 * @id 17033
 * @name 所闻遍计·真如
 * @description
 * 造成3点草元素伤害，所有敌方角色附属蕴种印。
 */
const AllSchemesToKnowTathata = skill(17033)
  .type("elemental")
  .costDendro(5)
  // TODO
  .done();

/**
 * @id 17034
 * @name 心景幻成
 * @description
 * 造成4点草元素伤害，生成摩耶之殿。
 */
const IllusoryHeart = skill(17034)
  .type("burst")
  .costDendro(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 1703
 * @name 纳西妲
 * @description
 * 白草净华，幽宫启蛰。
 */
const Nahida = character(1703)
  .tags("dendro", "catalyst", "sumeru")
  .skills(Akara, AllSchemesToKnow, AllSchemesToKnowTathata, IllusoryHeart)
  .done();

/**
 * @id 217031
 * @name 心识蕴藏之种
 * @description
 * 战斗行动：我方出战角色为纳西妲时，装备此牌。
 * 纳西妲装备此牌后，立刻使用一次心景幻成。
 * 装备有此牌的纳西妲在场时，根据我方队伍中存在的元素类型提供效果：
 * 火元素：摩耶之殿在场时，自身受到元素反应触发蕴种印的敌方角色，所受蕴种印的穿透伤害改为草元素伤害；
 * 雷元素：摩耶之殿入场时，使当前对方场上蕴种印的可用次数+1；
 * 水元素：装备有此牌的纳西妲所生成的摩耶之殿初始持续回合+1。
 * （牌组中包含纳西妲，才能加入牌组）
 */
const TheSeedOfStoredKnowledge = card(217031, "character")
  .costDendro(3)
  .costEnergy(2)
  .talentOf(Nahida)
  .equipment()
  // TODO
  .done();
