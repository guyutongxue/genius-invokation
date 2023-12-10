import { character, skill, summon, status, combatStatus, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 116031
 * @name 岩脊
 * @description
 * 结束阶段：造成1点岩元素伤害。
 * 可用次数：2
 */
const StoneStele = summon(116031)
  // TODO
  .done();

/**
 * @id 116033
 * @name 石化
 * @description
 * 角色无法使用技能。（持续到回合结束）
 */
const Petrification = status(116033)
  // TODO
  .done();

/**
 * @id 116032
 * @name 玉璋护盾
 * @description
 * 为我方出战角色提供2点护盾。
 */
const JadeShield = combatStatus(116032)
  // TODO
  .done();

/**
 * @id 16031
 * @name 岩雨
 * @description
 * 造成2点物理伤害。
 */
const RainOfStone = skill(16031)
  .type("normal")
  .costGeo(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 16032
 * @name 地心
 * @description
 * 造成1点岩元素伤害，召唤岩脊。
 */
const DominusLapidis = skill(16032)
  .type("elemental")
  .costGeo(3)
  // TODO
  .done();

/**
 * @id 16033
 * @name 地心·磐礴
 * @description
 * 造成3点岩元素伤害，召唤岩脊，生成玉璋护盾。
 */
const DominusLapidisStrikingStone = skill(16033)
  .type("elemental")
  .costGeo(5)
  // TODO
  .done();

/**
 * @id 16034
 * @name 天星
 * @description
 * 造成4点岩元素伤害，目标角色附属石化。
 */
const PlanetBefall = skill(16034)
  .type("burst")
  .costGeo(3)
  .costEnergy(3)
  // TODO
  .done();

/**
 * @id 1603
 * @name 钟离
 * @description
 * 韬玉之石，可明八荒；灿若天星，纵横无双 。
 */
const Zhongli = character(1603)
  .tags("geo", "pole", "liyue")
  .skills(RainOfStone, DominusLapidis, DominusLapidisStrikingStone, PlanetBefall)
  .done();

/**
 * @id 216031
 * @name 炊金馔玉
 * @description
 * 战斗行动：我方出战角色为钟离时，装备此牌。
 * 钟离装备此牌后，立刻使用一次地心·磐礴。
 * 我方出战角色在护盾角色状态或护盾出战状态的保护下时，我方召唤物造成的岩元素伤害+1。
 * （牌组中包含钟离，才能加入牌组）
 */
const DominanceOfEarth = card(216031)
  .costGeo(5)
  .talentOf(Zhongli)
  .equipment()
  // TODO
  .done();
